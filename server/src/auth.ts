import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "./db.js";
import { env } from "./env.js";
import type { SessionRow, UserRow } from "./types.js";

const BCRYPT_COST = 12;
const LAST_ACTIVE_THROTTLE_MS = 60_000;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createSession(userId: number): string {
  const id = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  db()
    .prepare(
      "INSERT INTO sessions (id, user_id, expires_at, last_active_at) VALUES (?, ?, ?, ?)",
    )
    .run(id, userId, now + env.sessionTtlMs, now);
  return id;
}

export function destroySession(sessionId: string): void {
  db().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function destroyAllSessionsForUser(userId: number): void {
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function loadSession(sessionId: string): SessionRow | null {
  const row = db()
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as SessionRow | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(sessionId);
    return null;
  }
  return row;
}

export function loadUser(id: number): UserRow | null {
  const row = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ?? null;
}

export function loadUserByNickname(nickname: string): UserRow | null {
  const row = db()
    .prepare("SELECT * FROM users WHERE nickname = ? COLLATE NOCASE")
    .get(nickname) as UserRow | undefined;
  return row ?? null;
}

export function setCookie(reply: FastifyReply, sessionId: string): void {
  reply.setCookie(env.cookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    path: "/",
    signed: false,
    maxAge: Math.floor(env.sessionTtlMs / 1000),
  });
}

export function clearCookie(reply: FastifyReply): void {
  reply.clearCookie(env.cookieName, { path: "/" });
}

function touchActive(userId: number, sessionId: string, lastActiveAt: number): void {
  const now = Date.now();
  if (now - lastActiveAt < LAST_ACTIVE_THROTTLE_MS) return;
  const tx = db().transaction(() => {
    db().prepare("UPDATE users SET last_active_at = ? WHERE id = ?").run(now, userId);
    db().prepare("UPDATE sessions SET last_active_at = ? WHERE id = ?").run(now, sessionId);
  });
  tx();
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const sid = req.cookies[env.cookieName];
  if (!sid) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  const session = loadSession(sid);
  if (!session) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  const user = loadUser(session.user_id);
  if (!user) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  req.user = user;
  req.session = session;
  touchActive(user.id, session.id, session.last_active_at);
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  if (!req.user || req.user.is_admin !== 1) {
    reply.code(403).send({ error: "forbidden" });
  }
}

// ───────── password reset tokens ─────────

export interface ResetTokenRow {
  token: string;
  user_id: number;
  created_by: number;
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

const RESET_TTL_MS = 24 * 60 * 60 * 1000;

export function createResetToken(userId: number, adminId: number): ResetTokenRow {
  // Revoca tokens previos no usados — evita stacking
  db().prepare(
    "DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL",
  ).run(userId);
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + RESET_TTL_MS;
  db()
    .prepare(
      `INSERT INTO password_reset_tokens (token, user_id, created_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(token, userId, adminId, now, expiresAt);
  return {
    token,
    user_id: userId,
    created_by: adminId,
    created_at: now,
    expires_at: expiresAt,
    used_at: null,
  };
}

export function loadValidResetToken(
  token: string,
): { row: ResetTokenRow; user: UserRow } | null {
  const row = db()
    .prepare("SELECT * FROM password_reset_tokens WHERE token = ?")
    .get(token) as ResetTokenRow | undefined;
  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at < Date.now()) return null;
  const user = loadUser(row.user_id);
  if (!user) return null;
  return { row, user };
}

export function consumeResetToken(token: string): void {
  db()
    .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token = ?")
    .run(Date.now(), token);
}

export function publicUser(u: UserRow) {
  return {
    id: u.id,
    fullName: u.full_name,
    nickname: u.nickname,
    photoUrl: u.photo_path ? `/uploads/${u.photo_path}` : null,
    isAdmin: u.is_admin === 1,
    createdAt: u.created_at,
    lastActiveAt: u.last_active_at,
  };
}
