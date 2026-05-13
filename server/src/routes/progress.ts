import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";
import type {
  CardProgress,
  DrilldownFeatureProgress,
  ExamAttempt,
  MemoramaStats,
} from "../types.js";
import { ApiError } from "../validation.js";

// ───────── helpers ─────────

function logActivity(
  userId: number,
  kind: string,
  payload: unknown,
  occurredAt: number = Date.now(),
): void {
  db()
    .prepare(
      "INSERT INTO activity_log (user_id, kind, occurred_at, payload_json) VALUES (?, ?, ?, ?)",
    )
    .run(userId, kind, occurredAt, payload != null ? JSON.stringify(payload) : null);
}

function isCardProgress(v: unknown): v is CardProgress {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.box === "number" &&
    o.box >= 1 &&
    o.box <= 5 &&
    typeof o.reviews === "number" &&
    typeof o.lapses === "number" &&
    typeof o.lastReviewed === "number"
  );
}

// ───────── flashcards ─────────

export default async function progressRoutes(app: FastifyInstance) {
  app.get("/api/progress/flashcards", { preHandler: requireAuth }, async (req) => {
    const rows = db()
      .prepare("SELECT card_id, box, reviews, lapses, last_reviewed FROM flashcard_progress WHERE user_id = ?")
      .all(req.user!.id) as {
      card_id: string;
      box: number;
      reviews: number;
      lapses: number;
      last_reviewed: number;
    }[];
    const map: Record<string, CardProgress> = {};
    for (const r of rows) {
      map[r.card_id] = {
        box: r.box as CardProgress["box"],
        reviews: r.reviews,
        lapses: r.lapses,
        lastReviewed: r.last_reviewed,
      };
    }
    return map;
  });

  app.patch("/api/progress/flashcards", { preHandler: requireAuth }, async (req) => {
    const body = req.body as Record<string, unknown> | null;
    if (!body || typeof body !== "object") throw new ApiError(400, "body inválido");
    const userId = req.user!.id;

    const existing = db()
      .prepare("SELECT card_id, box FROM flashcard_progress WHERE user_id = ?")
      .all(userId) as { card_id: string; box: number }[];
    const prevBox = new Map(existing.map((r) => [r.card_id, r.box]));

    const upsert = db().prepare(
      `INSERT INTO flashcard_progress (user_id, card_id, box, reviews, lapses, last_reviewed)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, card_id) DO UPDATE SET
         box = excluded.box,
         reviews = excluded.reviews,
         lapses = excluded.lapses,
         last_reviewed = excluded.last_reviewed`,
    );

    const masteredEvents: { cardId: string; lastReviewed: number }[] = [];
    const tx = db().transaction(() => {
      for (const [cardId, value] of Object.entries(body)) {
        if (!isCardProgress(value)) continue;
        upsert.run(userId, cardId, value.box, value.reviews, value.lapses, value.lastReviewed);
        if (value.box === 5 && (prevBox.get(cardId) ?? 0) < 5) {
          masteredEvents.push({ cardId, lastReviewed: value.lastReviewed });
        }
      }
    });
    tx();

    for (const ev of masteredEvents) {
      logActivity(userId, "card_mastered", { cardId: ev.cardId }, ev.lastReviewed || Date.now());
    }

    return { ok: true, mastered: masteredEvents.length };
  });

  // ───────── drilldown ─────────

  app.get("/api/progress/drilldown", { preHandler: requireAuth }, async (req) => {
    const rows = db()
      .prepare("SELECT feature_id, attempts, correct, last_attempt FROM drilldown_progress WHERE user_id = ?")
      .all(req.user!.id) as {
      feature_id: string;
      attempts: number;
      correct: number;
      last_attempt: number;
    }[];
    const map: Record<string, DrilldownFeatureProgress> = {};
    for (const r of rows) {
      map[r.feature_id] = {
        attempts: r.attempts,
        correct: r.correct,
        lastAttempt: r.last_attempt,
      };
    }
    return map;
  });

  app.post("/api/progress/drilldown/answer", { preHandler: requireAuth }, async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.featureId !== "string") throw new ApiError(400, "featureId requerido");
    const correct = body.correct === true ? 1 : 0;
    const now = Date.now();
    db()
      .prepare(
        `INSERT INTO drilldown_progress (user_id, feature_id, attempts, correct, last_attempt)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(user_id, feature_id) DO UPDATE SET
           attempts = attempts + 1,
           correct = correct + ?,
           last_attempt = ?`,
      )
      .run(req.user!.id, body.featureId, correct, now, correct, now);
    return { ok: true };
  });

  // ───────── memorama ─────────

  app.get("/api/memorama/stats", { preHandler: requireAuth }, async (req) => {
    const rows = db()
      .prepare("SELECT pairs, best_moves, best_time, played FROM memorama_stats WHERE user_id = ?")
      .all(req.user!.id) as {
      pairs: number;
      best_moves: number | null;
      best_time: number | null;
      played: number;
    }[];
    const stats: MemoramaStats = { played: 0, bestMovesByPairs: {}, bestTimeByPairs: {} };
    for (const r of rows) {
      stats.played += r.played;
      if (r.best_moves != null) stats.bestMovesByPairs[r.pairs] = r.best_moves;
      if (r.best_time != null) stats.bestTimeByPairs[r.pairs] = r.best_time;
    }
    return stats;
  });

  app.post("/api/memorama/game", { preHandler: requireAuth }, async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const pairs = Number(body.pairs);
    const moves = Number(body.moves);
    const timeMs = body.timeMs != null ? Number(body.timeMs) : null;
    if (![6, 8, 12, 18].includes(pairs)) throw new ApiError(400, "pairs inválido");
    if (!Number.isFinite(moves) || moves < 0) throw new ApiError(400, "moves inválido");

    const existing = db()
      .prepare("SELECT best_moves, best_time, played FROM memorama_stats WHERE user_id = ? AND pairs = ?")
      .get(req.user!.id, pairs) as
      | { best_moves: number | null; best_time: number | null; played: number }
      | undefined;

    const newBestMoves =
      existing?.best_moves == null ? moves : Math.min(existing.best_moves, moves);
    const newBestTime =
      timeMs == null
        ? existing?.best_time ?? null
        : existing?.best_time == null
          ? timeMs
          : Math.min(existing.best_time, timeMs);

    db()
      .prepare(
        `INSERT INTO memorama_stats (user_id, pairs, best_moves, best_time, played)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(user_id, pairs) DO UPDATE SET
           best_moves = ?,
           best_time = ?,
           played = played + 1`,
      )
      .run(req.user!.id, pairs, newBestMoves, newBestTime, newBestMoves, newBestTime);

    const beatMoves = existing?.best_moves != null && moves < existing.best_moves;
    const beatTime = timeMs != null && existing?.best_time != null && timeMs < existing.best_time;
    if (beatMoves || beatTime) {
      logActivity(req.user!.id, "memo_record", {
        pairs,
        moves,
        timeMs,
        beatMoves,
        beatTime,
      });
    }
    return { ok: true };
  });

  // ───────── exam ─────────

  app.get("/api/exam/attempts", { preHandler: requireAuth }, async (req) => {
    const rows = db()
      .prepare(
        `SELECT timestamp, total, answered, correct, duration_ms, passed, config_json
         FROM exam_attempts WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50`,
      )
      .all(req.user!.id) as {
      timestamp: number;
      total: number;
      answered: number;
      correct: number;
      duration_ms: number;
      passed: number;
      config_json: string;
    }[];
    return rows.map((r) => ({
      timestamp: r.timestamp,
      total: r.total,
      answered: r.answered,
      correct: r.correct,
      durationMs: r.duration_ms,
      passed: r.passed === 1,
      config: JSON.parse(r.config_json),
    }));
  });

  app.post("/api/exam/attempts", { preHandler: requireAuth }, async (req) => {
    const a = (req.body ?? {}) as Partial<ExamAttempt>;
    if (
      typeof a.timestamp !== "number" ||
      typeof a.total !== "number" ||
      typeof a.answered !== "number" ||
      typeof a.correct !== "number" ||
      typeof a.durationMs !== "number" ||
      typeof a.passed !== "boolean" ||
      a.config == null
    ) {
      throw new ApiError(400, "ExamAttempt inválido");
    }

    db()
      .prepare(
        `INSERT INTO exam_attempts (user_id, timestamp, total, answered, correct, duration_ms, passed, config_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.user!.id,
        a.timestamp,
        a.total,
        a.answered,
        a.correct,
        a.durationMs,
        a.passed ? 1 : 0,
        JSON.stringify(a.config),
      );

    logActivity(
      req.user!.id,
      a.passed ? "exam_passed" : "exam_failed",
      { total: a.total, correct: a.correct, durationMs: a.durationMs },
      a.timestamp,
    );

    // Capa a 50 intentos por usuario
    db()
      .prepare(
        `DELETE FROM exam_attempts WHERE id IN (
           SELECT id FROM exam_attempts WHERE user_id = ?
           ORDER BY timestamp DESC LIMIT -1 OFFSET 50
         )`,
      )
      .run(req.user!.id);

    return { ok: true };
  });

  // ───────── reset granular (botones del Stats Dashboard) ─────────

  app.delete("/api/progress/flashcards", { preHandler: requireAuth }, async (req) => {
    db().prepare("DELETE FROM flashcard_progress WHERE user_id = ?").run(req.user!.id);
    return { ok: true };
  });

  app.delete("/api/progress/drilldown", { preHandler: requireAuth }, async (req) => {
    db().prepare("DELETE FROM drilldown_progress WHERE user_id = ?").run(req.user!.id);
    return { ok: true };
  });

  app.delete("/api/memorama/stats", { preHandler: requireAuth }, async (req) => {
    db().prepare("DELETE FROM memorama_stats WHERE user_id = ?").run(req.user!.id);
    return { ok: true };
  });

  app.delete("/api/exam/attempts", { preHandler: requireAuth }, async (req) => {
    db().prepare("DELETE FROM exam_attempts WHERE user_id = ?").run(req.user!.id);
    return { ok: true };
  });

  // ───────── per-user configs (flashcard/memorama/exam/filters/theme) ─────────

  const CONFIG_KINDS = new Set([
    "flashcard",
    "memorama",
    "exam",
    "filters",
    "theme",
    "appearance",
  ]);

  app.get("/api/config/:kind", { preHandler: requireAuth }, async (req, reply) => {
    const { kind } = req.params as { kind: string };
    if (!CONFIG_KINDS.has(kind)) {
      reply.code(400).send({ error: "kind inválido" });
      return;
    }
    const row = db()
      .prepare("SELECT json FROM user_configs WHERE user_id = ? AND kind = ?")
      .get(req.user!.id, kind) as { json: string } | undefined;
    return { value: row ? JSON.parse(row.json) : null };
  });

  app.put("/api/config/:kind", { preHandler: requireAuth }, async (req, reply) => {
    const { kind } = req.params as { kind: string };
    if (!CONFIG_KINDS.has(kind)) {
      reply.code(400).send({ error: "kind inválido" });
      return;
    }
    const value = req.body;
    db()
      .prepare(
        `INSERT INTO user_configs (user_id, kind, json) VALUES (?, ?, ?)
         ON CONFLICT(user_id, kind) DO UPDATE SET json = excluded.json`,
      )
      .run(req.user!.id, kind, JSON.stringify(value));
    return { ok: true };
  });
}
