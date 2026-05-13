import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { createResetToken, loadUserByNickname, publicUser, requireAdmin } from "../auth.js";
import type { InviteRow, UserRow } from "../types.js";
import { generateInviteCode } from "./auth.js";
import { ApiError } from "../validation.js";

export default async function adminRoutes(app: FastifyInstance) {
  app.get("/api/admin/invites", { preHandler: requireAdmin }, async () => {
    const rows = db()
      .prepare(
        `SELECT i.*, u.nickname as used_by_nickname
           FROM invite_codes i
           LEFT JOIN users u ON u.id = i.used_by
           ORDER BY i.created_at DESC`,
      )
      .all() as (InviteRow & { used_by_nickname: string | null })[];
    return {
      invites: rows.map((r) => ({
        code: r.code,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        usedAt: r.used_at,
        usedBy: r.used_by_nickname,
      })),
    };
  });

  app.post("/api/admin/invites", { preHandler: requireAdmin }, async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const count = Math.max(1, Math.min(20, Number(body.count ?? 1)));
    const ttlDays = body.ttl_days != null ? Math.max(1, Math.min(365, Number(body.ttl_days))) : null;
    const now = Date.now();
    const expiresAt = ttlDays ? now + ttlDays * 86_400_000 : null;
    const created: string[] = [];
    const insert = db().prepare(
      "INSERT INTO invite_codes (code, created_by, created_at, expires_at) VALUES (?, ?, ?, ?)",
    );
    const tx = db().transaction(() => {
      for (let i = 0; i < count; i++) {
        // colisión muy improbable pero re-roll si pasa
        for (let attempt = 0; attempt < 5; attempt++) {
          const code = generateInviteCode();
          try {
            insert.run(code, req.user!.id, now, expiresAt);
            created.push(code);
            break;
          } catch (e) {
            if (attempt === 4) throw e;
          }
        }
      }
    });
    tx();
    return { codes: created };
  });

  app.delete("/api/admin/invites/:code", { preHandler: requireAdmin }, async (req, reply) => {
    const { code } = req.params as { code: string };
    const result = db()
      .prepare("DELETE FROM invite_codes WHERE code = ? AND used_by IS NULL")
      .run(code);
    if (result.changes === 0) {
      reply.code(400).send({ error: "no encontrado o ya usado" });
      return;
    }
    return { ok: true };
  });

  app.get("/api/admin/users", { preHandler: requireAdmin }, async () => {
    const rows = db().prepare("SELECT * FROM users ORDER BY created_at DESC").all() as UserRow[];
    return { users: rows.map(publicUser) };
  });

  app.post(
    "/api/admin/users/:nickname/reset-password",
    { preHandler: requireAdmin },
    async (req) => {
      const { nickname } = req.params as { nickname: string };
      const target = loadUserByNickname(nickname);
      if (!target) throw new ApiError(404, "Usuario no encontrado");
      if (target.id === req.user!.id) {
        throw new ApiError(
          400,
          "No te puedes resetear a ti mismo desde aquí — usa /ajustes",
        );
      }
      const tok = createResetToken(target.id, req.user!.id);
      return {
        token: tok.token,
        expiresAt: tok.expires_at,
        targetNickname: target.nickname,
        targetFullName: target.full_name,
      };
    },
  );

  app.delete(
    "/api/admin/users/:nickname",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { nickname } = req.params as { nickname: string };
      const body = (req.body ?? {}) as Record<string, unknown>;
      const target = loadUserByNickname(nickname);
      if (!target) throw new ApiError(404, "Usuario no encontrado");
      if (target.id === req.user!.id) {
        throw new ApiError(400, "No te puedes eliminar a ti mismo");
      }
      // Defensa en profundidad: el cliente debe re-enviar el nickname como confirmación
      if (typeof body.confirm !== "string" || body.confirm !== target.nickname) {
        throw new ApiError(400, "Confirmación incorrecta");
      }
      // ON DELETE CASCADE limpia sessions, progresos, configs, activity_log,
      // password_reset_tokens, y SET NULL en invite_codes.used_by/created_by
      db().prepare("DELETE FROM users WHERE id = ?").run(target.id);
      reply.send({ ok: true, deletedNickname: target.nickname });
    },
  );
}
