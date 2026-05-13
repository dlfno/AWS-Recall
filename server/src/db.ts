import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
  fs.mkdirSync(env.uploadsDir, { recursive: true });
  const instance = new Database(env.dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  const sql = fs.readFileSync(env.schemaPath, "utf8");
  instance.exec(sql);
  bootstrapInviteIfNeeded(instance);
  housekeeping(instance);
  _db = instance;
  return instance;
}

function housekeeping(instance: Database.Database): void {
  // Limpieza barata en cada cold start. Las queries activas ya filtran por
  // expires_at / ventana de tiempo, así que esto solo evita que las tablas
  // crezcan sin tope.
  const now = Date.now();
  const sixMonthsMs = 180 * 86_400_000;
  const thirtyDaysMs = 30 * 86_400_000;
  instance.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  instance
    .prepare("DELETE FROM activity_log WHERE occurred_at < ?")
    .run(now - sixMonthsMs);
  // Tokens expirados y los ya usados con más de 30 días
  instance
    .prepare(
      "DELETE FROM password_reset_tokens WHERE expires_at < ? OR (used_at IS NOT NULL AND used_at < ?)",
    )
    .run(now, now - thirtyDaysMs);
}

function bootstrapInviteIfNeeded(instance: Database.Database): void {
  if (!env.bootstrapInvite) return;
  const exists = instance
    .prepare("SELECT code FROM invite_codes WHERE code = ?")
    .get(env.bootstrapInvite);
  if (exists) return;
  // Solo siembra si no hay usuarios todavía — protege contra dejar BOOTSTRAP_INVITE seteado por accidente
  const { count } = instance.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (count > 0) return;
  instance
    .prepare(
      "INSERT INTO invite_codes (code, created_by, created_at, expires_at) VALUES (?, NULL, ?, NULL)",
    )
    .run(env.bootstrapInvite, Date.now());
  // El primer usuario que use este código se vuelve admin (manejado en /auth/register)
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
