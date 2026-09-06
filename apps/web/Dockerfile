# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# ANGALY — Web (Next.js 15)
# Multi-stage build using output: 'standalone' for minimal image size.
#   deps    → install workspace deps (cached)
#   builder → next build → .next/standalone
#   runner  → standalone + static assets only
# ─────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/types/package.json       ./packages/types/
COPY packages/database/package.json    ./packages/database/
COPY packages/config/                  ./packages/config/
COPY apps/web/package.json             ./apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
WORKDIR /app
COPY packages/types/    ./packages/types/
COPY packages/database/ ./packages/database/
COPY apps/web/          ./apps/web/
RUN mkdir -p /app/apps/web/public

RUN pnpm --filter @angaly/types build

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @angaly/web build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public             ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1

CMD ["node", "apps/web/server.js"]
