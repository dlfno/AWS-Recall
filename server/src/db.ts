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
  _db = instance;
  return instance;
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
