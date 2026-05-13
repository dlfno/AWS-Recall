import type { FastifyInstance } from "fastify";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../db.js";
import {
  destroyAllSessionsForUser,
  hashPassword,
  publicUser,
  requireAuth,
  verifyPassword,
} from "../auth.js";
import { env } from "../env.js";
import type { UserRow } from "../types.js";
import { ApiError, validateFullName, validatePassword } from "../validation.js";

export default async function meRoutes(app: FastifyInstance) {
  app.patch("/api/me/profile", { preHandler: requireAuth }, async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.full_name !== undefined) {
      const fullName = validateFullName(body.full_name);
      db().prepare("UPDATE users SET full_name = ? WHERE id = ?").run(fullName, req.user!.id);
    }
    const u = db().prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as UserRow;
    return { user: publicUser(u) };
  });

  app.put("/api/me/password", { preHandler: requireAuth }, async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.old !== "string") throw new ApiError(400, "Contraseña actual requerida");
    const newPassword = validatePassword(body.new);
    const ok = await verifyPassword(body.old, req.user!.password_hash);
    if (!ok) throw new ApiError(400, "Contraseña actual incorrecta");
    const hash = await hashPassword(newPassword);
    db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.user!.id);
    // Cierra todas las otras sesiones — la actual se invalidaría también, así que reissue
    destroyAllSessionsForUser(req.user!.id);
    return { ok: true, reauth: true };
  });

  app.post("/api/me/photo", { preHandler: requireAuth }, async (req, reply) => {
    const file = await req.file();
    if (!file) throw new ApiError(400, "Archivo requerido");
    if (!file.mimetype.startsWith("image/")) throw new ApiError(400, "Solo imágenes");

    const buf = await file.toBuffer();
    const avatarsDir = path.join(env.uploadsDir, "avatars");
    await fs.mkdir(avatarsDir, { recursive: true });
    const relPath = `avatars/${req.user!.id}.webp`;
    const absPath = path.join(env.uploadsDir, relPath);
    await sharp(buf)
      .rotate()
      .resize(256, 256, { fit: "cover", position: "centre" })
      .webp({ quality: 86 })
      .toFile(absPath);

    db().prepare("UPDATE users SET photo_path = ? WHERE id = ?").run(relPath, req.user!.id);
    const u = db().prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as UserRow;
    reply.send({ user: publicUser(u) });
  });

  app.delete("/api/me/photo", { preHandler: requireAuth }, async (req) => {
    if (req.user!.photo_path) {
      const abs = path.join(env.uploadsDir, req.user!.photo_path);
      await fs.unlink(abs).catch(() => undefined);
    }
    db().prepare("UPDATE users SET photo_path = NULL WHERE id = ?").run(req.user!.id);
    const u = db().prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as UserRow;
    return { user: publicUser(u) };
  });
}
