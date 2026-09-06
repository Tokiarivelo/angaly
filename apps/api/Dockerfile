# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# ANGALY — API (NestJS)
# Multi-stage build:
#   deps        → install all workspace deps (cached)
#   builder     → compile @angaly/types, generate Prisma, compile NestJS
#   runner      → minimal alpine image with dist + production node_modules
# ─────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate
# python3/make/g++: fallback toolchain for native addons (bcrypt, etc.) when no
# prebuilt musl binary matches the runner's arch (build-stage only, not shipped).
RUN apk add --no-cache python3 make g++

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/
COPY packages/storage/package.json     ./packages/storage/
COPY packages/config/                  ./packages/config/
COPY apps/api/package.json             ./apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY packages/types/    ./packages/types/
COPY packages/database/ ./packages/database/
COPY packages/storage/  ./packages/storage/
COPY apps/api/          ./apps/api/

RUN pnpm --filter @angaly/types build
RUN pnpm --filter @angaly/storage build
RUN pnpm --filter @angaly/database db:generate
RUN pnpm --filter @angaly/database exec tsc prisma/seed.ts \
    --outDir prisma-dist --module commonjs --moduleResolution node \
    --target es2020 --esModuleInterop --skipLibCheck
RUN pnpm --filter @angaly/api build
RUN pnpm --filter @angaly/api --prod deploy /bundle

# pnpm deploy excludes gitignored files — copy the generated Prisma client and
# compiled seed explicitly (schema.prisma + migrations are not gitignored, so
# `pnpm deploy` already copied those).
RUN cp -r packages/database/generated /bundle/node_modules/@angaly/database/generated
RUN cp -r packages/database/prisma-dist /bundle/node_modules/@angaly/database/prisma-dist
RUN cp -r apps/api/dist /bundle/dist

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs \
    && chown -R nestjs:nodejs /app

COPY --from=builder --chown=nestjs:nodejs /bundle/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /bundle/dist         ./dist
COPY --from=builder --chown=nestjs:nodejs /bundle/package.json ./package.json

USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health > /dev/null || exit 1

# Migrations run at container start (only the running container has DATABASE_URL
# and network access to postgres). `prisma` is a direct @angaly/api dependency
# (not just @angaly/database's) so pnpm deploy hoists it to the bundle's
# top-level node_modules — its CLI entry file is invoked directly since nested
# workspace deps don't reliably get bin shims from pnpm deploy. migrate deploy
# is a no-op if already applied; seed.ts is upsert-based — both safe to re-run.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema node_modules/@angaly/database/prisma/schema.prisma && node node_modules/@angaly/database/prisma-dist/seed.js && exec node dist/main.js"]
