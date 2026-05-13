import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";
import { db, closeDb } from "./db.js";
import { ApiError } from "./validation.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import adminRoutes from "./routes/admin.js";
import progressRoutes from "./routes/progress.js";
import socialRoutes from "./routes/social.js";

async function build() {
  const app = Fastify({
    logger: { level: env.isProd ? "info" : "debug" },
    bodyLimit: 6 * 1024 * 1024,
  });

  await app.register(cookie, { secret: env.cookieSecret });
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  db(); // open + migrate

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ApiError) {
      reply.code(err.statusCode).send({ error: err.message });
      return;
    }
    const e = err as Error & { validation?: unknown };
    if (e.validation) {
      reply.code(400).send({ error: e.message });
      return;
    }
    app.log.error(e);
    reply.code(500).send({ error: "internal_error" });
  });

  // Health
  app.get("/api/health", async () => ({ ok: true, ts: Date.now() }));

  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(adminRoutes);
  await app.register(progressRoutes);
  await app.register(socialRoutes);

  // Uploads (avatars) servidos como estáticos desde el volumen
  if (fs.existsSync(env.uploadsDir)) {
    await app.register(fastifyStatic, {
      root: env.uploadsDir,
      prefix: "/uploads/",
      decorateReply: false,
    });
  }

  // Frontend estático (en producción Vite build se copia a /srv/public)
  if (fs.existsSync(env.publicDir)) {
    await app.register(fastifyStatic, {
      root: env.publicDir,
      prefix: "/",
    });
    // SPA fallback: cualquier ruta no-API devuelve index.html
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/") || req.url.startsWith("/uploads/")) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      reply.type("text/html").send(fs.readFileSync(path.join(env.publicDir, "index.html")));
    });
  }

  return app;
}

const app = await build();

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  closeDb();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: env.port, host: env.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
