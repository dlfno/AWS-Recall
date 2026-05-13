import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { publicUser, requireAuth } from "../auth.js";
import type { UserRow } from "../types.js";
import { ApiError } from "../validation.js";

const DAY_MS = 86_400_000;

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Devuelve la racha (días consecutivos hasta hoy, o desde ayer si hoy no tiene actividad).
function computeStreakForUser(userId: number): number {
  const rows = db()
    .prepare(
      `SELECT occurred_at as ts FROM activity_log WHERE user_id = ?
       UNION ALL SELECT last_reviewed as ts FROM flashcard_progress WHERE user_id = ? AND last_reviewed > 0
       UNION ALL SELECT last_attempt as ts FROM drilldown_progress WHERE user_id = ? AND last_attempt > 0
       UNION ALL SELECT timestamp as ts FROM exam_attempts WHERE user_id = ?`,
    )
    .all(userId, userId, userId, userId) as { ts: number }[];
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => dayKey(r.ts)));
  let cursor = new Date();
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

function computeHeatmapForUser(userId: number, days: number): { day: string; count: number }[] {
  const rows = db()
    .prepare(
      `SELECT occurred_at as ts FROM activity_log WHERE user_id = ? AND occurred_at >= ?
       UNION ALL SELECT last_reviewed as ts FROM flashcard_progress WHERE user_id = ? AND last_reviewed >= ?
       UNION ALL SELECT last_attempt as ts FROM drilldown_progress WHERE user_id = ? AND last_attempt >= ?
       UNION ALL SELECT timestamp as ts FROM exam_attempts WHERE user_id = ? AND timestamp >= ?`,
    )
    .all(
      userId,
      Date.now() - days * DAY_MS,
      userId,
      Date.now() - days * DAY_MS,
      userId,
      Date.now() - days * DAY_MS,
      userId,
      Date.now() - days * DAY_MS,
    ) as { ts: number }[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = dayKey(r.ts);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = Date.now() - i * DAY_MS;
    const k = dayKey(t);
    out.push({ day: k, count: counts.get(k) ?? 0 });
  }
  return out;
}

interface UserStats {
  flashcards: {
    cardsSeen: number;
    mastered: number;       // box >= 4
    totalReviews: number;
    totalLapses: number;
    accuracy: number;        // (reviews - lapses) / reviews
  };
  drilldown: {
    attempts: number;
    correct: number;
    accuracy: number;
    featuresMastered: number; // attempts >= 5 && accuracy >= 0.8
  };
  memorama: {
    played: number;
    bestMovesByPairs: Record<number, number>;
    bestTimeByPairs: Record<number, number>;
  };
  exams: {
    taken: number;
    passed: number;
    bestRate: number;
    lastTimestamp: number;
  };
}

function computeStatsForUser(userId: number): UserStats {
  const fl = db()
    .prepare(
      `SELECT
         COUNT(*) as cardsSeen,
         SUM(CASE WHEN box >= 4 THEN 1 ELSE 0 END) as mastered,
         COALESCE(SUM(reviews), 0) as totalReviews,
         COALESCE(SUM(lapses), 0) as totalLapses
       FROM flashcard_progress WHERE user_id = ?`,
    )
    .get(userId) as {
    cardsSeen: number;
    mastered: number;
    totalReviews: number;
    totalLapses: number;
  };
  const flAccuracy =
    fl.totalReviews > 0 ? (fl.totalReviews - fl.totalLapses) / fl.totalReviews : 0;

  const dd = db()
    .prepare(
      `SELECT
         COALESCE(SUM(attempts), 0) as attempts,
         COALESCE(SUM(correct), 0) as correct,
         COALESCE(SUM(CASE WHEN attempts >= 5 AND correct * 1.0 / attempts >= 0.8 THEN 1 ELSE 0 END), 0) as featuresMastered
       FROM drilldown_progress WHERE user_id = ?`,
    )
    .get(userId) as { attempts: number; correct: number; featuresMastered: number };
  const ddAccuracy = dd.attempts > 0 ? dd.correct / dd.attempts : 0;

  const memoRows = db()
    .prepare(
      "SELECT pairs, best_moves, best_time, played FROM memorama_stats WHERE user_id = ?",
    )
    .all(userId) as {
    pairs: number;
    best_moves: number | null;
    best_time: number | null;
    played: number;
  }[];
  const bestMovesByPairs: Record<number, number> = {};
  const bestTimeByPairs: Record<number, number> = {};
  let memoPlayed = 0;
  for (const m of memoRows) {
    memoPlayed += m.played;
    if (m.best_moves != null) bestMovesByPairs[m.pairs] = m.best_moves;
    if (m.best_time != null) bestTimeByPairs[m.pairs] = m.best_time;
  }

  const examAgg = db()
    .prepare(
      `SELECT COUNT(*) as taken,
              COALESCE(SUM(passed), 0) as passed,
              COALESCE(MAX(correct * 1.0 / NULLIF(total, 0)), 0) as bestRate,
              COALESCE(MAX(timestamp), 0) as lastTimestamp
       FROM exam_attempts WHERE user_id = ?`,
    )
    .get(userId) as { taken: number; passed: number; bestRate: number; lastTimestamp: number };

  return {
    flashcards: {
      cardsSeen: fl.cardsSeen,
      mastered: fl.mastered,
      totalReviews: fl.totalReviews,
      totalLapses: fl.totalLapses,
      accuracy: flAccuracy,
    },
    drilldown: {
      attempts: dd.attempts,
      correct: dd.correct,
      accuracy: ddAccuracy,
      featuresMastered: dd.featuresMastered,
    },
    memorama: { played: memoPlayed, bestMovesByPairs, bestTimeByPairs },
    exams: examAgg,
  };
}

export default async function socialRoutes(app: FastifyInstance) {
  // Lista de miembros (para /miembros)
  app.get("/api/users", { preHandler: requireAuth }, async () => {
    const users = db()
      .prepare("SELECT * FROM users ORDER BY last_active_at DESC")
      .all() as UserRow[];
    return {
      users: users.map((u) => ({
        ...publicUser(u),
        streak: computeStreakForUser(u.id),
      })),
    };
  });

  // Perfil público por nickname
  app.get("/api/users/:nickname", { preHandler: requireAuth }, async (req) => {
    const { nickname } = req.params as { nickname: string };
    const u = db()
      .prepare("SELECT * FROM users WHERE nickname = ? COLLATE NOCASE")
      .get(nickname) as UserRow | undefined;
    if (!u) throw new ApiError(404, "Usuario no encontrado");
    return {
      user: publicUser(u),
      stats: computeStatsForUser(u.id),
      streak: computeStreakForUser(u.id),
      heatmap28: computeHeatmapForUser(u.id, 28),
    };
  });

  // Comparación 1-a-1
  app.get("/api/compare", { preHandler: requireAuth }, async (req) => {
    const { a, b } = req.query as { a?: string; b?: string };
    if (!a || !b) throw new ApiError(400, "Faltan parámetros a, b");
    const ua = db()
      .prepare("SELECT * FROM users WHERE nickname = ? COLLATE NOCASE")
      .get(a) as UserRow | undefined;
    const ub = db()
      .prepare("SELECT * FROM users WHERE nickname = ? COLLATE NOCASE")
      .get(b) as UserRow | undefined;
    if (!ua || !ub) throw new ApiError(404, "Usuario no encontrado");
    return {
      a: {
        user: publicUser(ua),
        streak: computeStreakForUser(ua.id),
        stats: computeStatsForUser(ua.id),
      },
      b: {
        user: publicUser(ub),
        streak: computeStreakForUser(ub.id),
        stats: computeStatsForUser(ub.id),
      },
    };
  });

  // Leaderboards por modo
  app.get("/api/leaderboard", { preHandler: requireAuth }, async (req) => {
    const { mode } = req.query as { mode?: string };
    if (!mode || !["flashcards", "memorama", "drilldown", "exams"].includes(mode)) {
      throw new ApiError(400, "mode inválido");
    }
    let rows: { user_id: number; metric: number; secondary?: number }[] = [];
    if (mode === "flashcards") {
      rows = db()
        .prepare(
          `SELECT user_id,
                  SUM(CASE WHEN box >= 4 THEN 1 ELSE 0 END) as metric,
                  COUNT(*) as secondary
             FROM flashcard_progress
            GROUP BY user_id
            HAVING metric > 0
            ORDER BY metric DESC LIMIT 50`,
        )
        .all() as { user_id: number; metric: number; secondary: number }[];
    } else if (mode === "drilldown") {
      rows = db()
        .prepare(
          `SELECT user_id,
                  CAST(SUM(correct) AS REAL) / NULLIF(SUM(attempts), 0) as metric,
                  SUM(attempts) as secondary
             FROM drilldown_progress
            GROUP BY user_id
            HAVING SUM(attempts) >= 10
            ORDER BY metric DESC LIMIT 50`,
        )
        .all() as { user_id: number; metric: number; secondary: number }[];
    } else if (mode === "exams") {
      rows = db()
        .prepare(
          `SELECT user_id,
                  SUM(passed) as metric,
                  COUNT(*) as secondary
             FROM exam_attempts
            GROUP BY user_id
            HAVING COUNT(*) > 0
            ORDER BY metric DESC, secondary ASC LIMIT 50`,
        )
        .all() as { user_id: number; metric: number; secondary: number }[];
    } else if (mode === "memorama") {
      // Suma de juegos jugados como métrica primaria; secondary = mejor tiempo (menor mejor) en 18 pares si existe
      rows = db()
        .prepare(
          `SELECT m.user_id,
                  COALESCE(SUM(m.played), 0) as metric,
                  COALESCE(MIN(m.best_time), 0) as secondary
             FROM memorama_stats m
            GROUP BY m.user_id
            HAVING metric > 0
            ORDER BY metric DESC LIMIT 50`,
        )
        .all() as { user_id: number; metric: number; secondary: number }[];
    }
    const userMap = new Map<number, UserRow>();
    for (const u of db().prepare("SELECT * FROM users").all() as UserRow[]) {
      userMap.set(u.id, u);
    }
    return {
      mode,
      entries: rows
        .map((r) => {
          const u = userMap.get(r.user_id);
          if (!u) return null;
          return {
            user: publicUser(u),
            metric: r.metric,
            secondary: r.secondary,
          };
        })
        .filter(Boolean),
    };
  });

  // Feed de actividad reciente
  app.get("/api/feed", { preHandler: requireAuth }, async (req) => {
    const { limit } = req.query as { limit?: string };
    const n = Math.max(1, Math.min(100, Number(limit ?? 50)));
    const rows = db()
      .prepare(
        `SELECT a.id, a.user_id, a.kind, a.occurred_at, a.payload_json,
                u.nickname, u.full_name, u.photo_path
           FROM activity_log a
           JOIN users u ON u.id = a.user_id
          ORDER BY a.occurred_at DESC LIMIT ?`,
      )
      .all(n) as {
      id: number;
      user_id: number;
      kind: string;
      occurred_at: number;
      payload_json: string | null;
      nickname: string;
      full_name: string;
      photo_path: string | null;
    }[];
    return {
      events: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        occurredAt: r.occurred_at,
        payload: r.payload_json ? JSON.parse(r.payload_json) : null,
        user: {
          id: r.user_id,
          nickname: r.nickname,
          fullName: r.full_name,
          photoUrl: r.photo_path ? `/uploads/${r.photo_path}` : null,
        },
      })),
    };
  });
}
