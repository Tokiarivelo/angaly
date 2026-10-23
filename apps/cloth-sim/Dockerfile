# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# ANGALY — cloth-sim worker (realistic render: Blender cloth simulation)
# docs/features/realistic-render-blender.md · build context = repository root:
#   docker build -f apps/cloth-sim/Dockerfile -t angaly-cloth-sim .
#
# The worker (cloth_sim/worker.py, system Python, stdlib only) claims jobs from the API, runs tools/export-job.ts
# (Node: the 3D viewer's drape code) then Blender headless. Blender is GPL: running it on our servers imposes nothing,
# but do not publish this image without Blender's licence and sources (§4 of the feature sheet).
# ─────────────────────────────────────────────────────────────────────────────

ARG BLENDER_VERSION=4.5.14

# ── @angaly/types, built (export-job.ts and the viewer code import it) ───────
FROM node:22-bookworm-slim AS types
WORKDIR /build
RUN npm install --no-save --no-audit --no-fund typescript@5.6.3
COPY packages/types ./packages/types
RUN cd packages/types && npx tsc -p tsconfig.build.json

# ── Node dependencies of the export step ────────────────────────────────────
FROM node:22-bookworm-slim AS node-deps
WORKDIR /app
RUN npm init -y >/dev/null && npm install --no-audit --no-fund three@0.170.0 tsx@4.19.2

# ── Blender official build (the Ubuntu package renders black), SHA-256 checked ─
FROM ubuntu:24.04 AS blender
ARG BLENDER_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt
RUN set -eux; \
    series="$(echo "$BLENDER_VERSION" | cut -d. -f1,2)"; \
    base="https://download.blender.org/release/Blender${series}"; \
    archive="blender-${BLENDER_VERSION}-linux-x64.tar.xz"; \
    curl -fSLO "$base/$archive"; \
    curl -fsSL "$base/blender-${BLENDER_VERSION}.sha256" | grep " ${archive}\$" | sha256sum -c -; \
    tar -xJf "$archive"; rm "$archive"; mv "blender-${BLENDER_VERSION}-linux-x64" blender

# ── Runner ──────────────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates python3 libxi6 libxrender1 libxkbcommon0 libsm6 libgl1 libegl1 libxfixes3 libxxf86vm1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node-deps /usr/local/bin/node /usr/local/bin/node
COPY --from=blender /opt/blender /opt/blender

WORKDIR /app
# Same layout as the repository: export-job.ts imports ../../web/src/… relatively.
COPY --from=node-deps /app/node_modules ./node_modules
COPY --from=types /build/packages/types/package.json ./node_modules/@angaly/types/package.json
COPY --from=types /build/packages/types/dist ./node_modules/@angaly/types/dist
COPY apps/web/src/features/pattern-studio-preview-validation-export ./apps/web/src/features/pattern-studio-preview-validation-export
COPY apps/web/public/models/human-base.glb ./apps/web/public/models/human-base.glb
COPY apps/cloth-sim/cloth_sim ./apps/cloth-sim/cloth_sim
COPY apps/cloth-sim/scripts ./apps/cloth-sim/scripts
COPY apps/cloth-sim/tools ./apps/cloth-sim/tools

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    BLENDER=/opt/blender/blender \
    CLOTH_SIM_EXPORT_CMD="node /app/node_modules/tsx/dist/cli.mjs /app/apps/cloth-sim/tools/export-job.ts" \
    CLOTH_SIM_WORKDIR=/tmp/cloth-sim

RUN useradd --system --create-home app && mkdir -p /tmp/cloth-sim && chown app /tmp/cloth-sim
USER app
WORKDIR /app/apps/cloth-sim

CMD ["python3", "-m", "cloth_sim.worker"]
