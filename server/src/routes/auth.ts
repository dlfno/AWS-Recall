import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { db } from "../db.js";
import {
  clearCookie,
  createSession,
  destroySession,
  hashPassword,
  loadUserByNickname,
  publicUser,
  requireAuth,
  setCookie,
  verifyPassword,
} from "../auth.js";
import { env } from "../env.js";
import type { InviteRow, UserRow } from "../types.js";
import {
  ApiError,
  validateFullName,
  validateInviteCode,
  validateNickname,
  validatePassword,
} from "../validation.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const inviteCode = validateInviteCode(body.invite_code);
    const nickname = validateNickname(body.nickname);
    const fullName = validateFullName(body.full_name);
    const password = validatePassword(body.password);

    const invite = db()
      .prepare("SELECT * FROM invite_codes WHERE code = ?")
      .get(inviteCode) as InviteRow | undefined;
    if (!invite) throw new ApiError(400, "Código inválido");
    if (invite.used_by) throw new ApiError(400, "Código ya usado");
    if (invite.expires_at && invite.expires_at < Date.now()) {
      throw new ApiError(400, "Código expirado");
    }

    if (loadUserByNickname(nickname)) {
      throw new ApiError(409, "Apodo ya está tomado");
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();

    // El primer usuario del sistema (cuando usa BOOTSTRAP_INVITE) se vuelve admin
    const { count } = db().prepare("SELECT COUNT(*) as count FROM users").get() as {
      count: number;
    };
    const isAdmin = count === 0 ? 1 : 0;

    const userId = db().transaction(() => {
      const result = db()
        .prepare(
          `INSERT INTO users (full_name, nickname, password_hash, photo_path, is_admin, created_at, last_active_at)
           VALUES (?, ?, ?, NULL, ?, ?, ?)`,
        )
        .run(fullName, nickname, passwordHash, isAdmin, now, now);
      const newId = Number(result.lastInsertRowid);
      db()
        .prepare("UPDATE invite_codes SET used_by = ?, used_at = ? WHERE code = ?")
        .run(newId, now, inviteCode);
      return newId;
    })();

    const user = db().prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow;
    const sid = createSession(userId);
    setCookie(reply, sid);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const nickname = validateNickname(body.nickname);
    const password = validatePassword(body.password);

    const user = loadUserByNickname(nickname);
    if (!user) throw new ApiError(401, "Credenciales inválidas");
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw new ApiError(401, "Credenciales inválidas");

    const sid = createSession(user.id);
    setCookie(reply, sid);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/logout", async (req, reply) => {
    const sid = req.cookies[env.cookieName];
    if (sid) destroySession(sid);
    clearCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (req) => {
    return { user: publicUser(req.user!) };
  });

  // Bootstrap helper: si no hay invites en absoluto, no expone nada.
  // El BOOTSTRAP_INVITE se siembra en db.ts cuando no hay usuarios.
  app.get("/api/auth/bootstrap-status", async () => {
    const { count } = db().prepare("SELECT COUNT(*) as count FROM users").get() as {
      count: number;
    };
    return { hasUsers: count > 0 };
  });
}

export function generateInviteCode(): string {
  // Base32 sin caracteres ambiguos (0/O/1/I/L), 8 chars
  const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHA[bytes[i] % ALPHA.length];
  return out;
}
