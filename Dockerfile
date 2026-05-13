# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────
# Stage 1: build frontend (vite → static dist/)
# ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
COPY data ./data
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: build backend (tsc → dist/)
# ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS backend-build
WORKDIR /srv
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: runtime
# ─────────────────────────────────────────────
FROM node:20-bookworm-slim
WORKDIR /srv
ENV NODE_ENV=production \
    DB_PATH=/data/recall.db \
    UPLOADS_DIR=/uploads \
    PUBLIC_DIR=/srv/public

# Solo dependencias de producción
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend-build /srv/dist ./dist
COPY --from=frontend     /app/dist ./public
COPY server/src/schema.sql ./dist/schema.sql

RUN mkdir -p /data /uploads
VOLUME ["/data", "/uploads"]

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
