import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? "0.0.0.0",
  dbPath: process.env.DB_PATH ?? path.resolve(here, "../data/recall.db"),
  uploadsDir: process.env.UPLOADS_DIR ?? path.resolve(here, "../data/uploads"),
  schemaPath: path.resolve(here, "./schema.sql"),
  publicDir: process.env.PUBLIC_DIR ?? path.resolve(here, "../public"),
  cookieSecret: required("COOKIE_SECRET", process.env.NODE_ENV === "production" ? undefined : "dev-secret-change-me-please-32chars-min"),
  cookieName: "recall_sid",
  cookieSecure: process.env.NODE_ENV === "production",
  sessionTtlMs: 1000 * 60 * 60 * 24 * 30, // 30 días
  bootstrapInvite: process.env.BOOTSTRAP_INVITE ?? null,
  isProd: process.env.NODE_ENV === "production",
};
