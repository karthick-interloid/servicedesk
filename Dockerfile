# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# ^ SESSION_SECRET below is a throwaway build-time placeholder that only exists to
#   satisfy the env validation in src/config/env.ts during `next build`. It is
#   server-only (never inlined into any bundle) and the REAL secret is supplied at
#   runtime via --env-file / compose env_file. The check is skipped deliberately.

# Multi-stage build producing a minimal production image from Next.js's
# `output: "standalone"` bundle. See the Docker section in docs/IMPLEMENTATION.md.
# Node version is kept in sync with .nvmrc (24.15.0).

# ---- Base ---------------------------------------------------------------------
# Pinned by digest for reproducible builds (the tag alone is mutable). This is
# node:24-alpine — refresh the digest with:
#   docker pull node:24-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:24-alpine
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS base

# ---- Dependencies -------------------------------------------------------------
# Installed in their own stage so this layer is cached unless the lockfile changes.
FROM base AS deps
# libc6-compat: some native deps (e.g. sharp) expect glibc symbols on Alpine/musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` here (not `npm install` like ci.yml): the Docker build always runs on
# Linux, so the lockfile-drift issue that makes CI prefer `npm install` doesn't
# apply, and a reproducible, lockfile-strict install is what we want for an image.
# --mount=type=cache reuses npm's download cache across builds (BuildKit), so
# rebuilds don't re-download every package.
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- Builder ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# src/config/env.ts validates process.env at build time (it throws on a missing
# required var), and every NEXT_PUBLIC_* value is INLINED into the client bundle
# during `next build`. So the required vars must exist here, as build args.
# NEXT_PUBLIC_* values are baked in now — to change them you must rebuild the image
# (setting a different runtime value later does NOT update the client bundle).
ARG SESSION_SECRET="build-time-placeholder-session-secret-change-me"
ARG NEXT_PUBLIC_API_URL="http://localhost:5000"
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ARG NEXT_PUBLIC_SITE_NAME="Starter Template"
ARG NEXT_PUBLIC_SITE_DESCRIPTION="A production-ready Next.js starter template."
ARG NEXT_PUBLIC_TWITTER_HANDLE=""
ARG NEXT_PUBLIC_SENTRY_DSN=""

ENV SESSION_SECRET=$SESSION_SECRET \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_SITE_DESCRIPTION=$NEXT_PUBLIC_SITE_DESCRIPTION \
    NEXT_PUBLIC_TWITTER_HANDLE=$NEXT_PUBLIC_TWITTER_HANDLE \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_TELEMETRY_DISABLED=1

# For running MORE THAN ONE container of the same build (load balancer, k8s, rolling
# deploys): set both to fixed values so every replica agrees, or you get version-skew
# and "Failed to find Server Action" errors. Left empty for single-instance runs,
# where Next.js generates its own per-build defaults — so this changes nothing there.
#   NEXT_BUILD_ID                        — consistent build identifier across replicas
#   NEXT_SERVER_ACTIONS_ENCRYPTION_KEY   — base64 AES key (16/24/32 bytes); generate with:
#     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ARG NEXT_BUILD_ID=""
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=""

# Scoped to the build command only (not persisted as image ENV). Empty values are
# falsy, so Next.js falls back to its defaults exactly as before.
RUN NEXT_BUILD_ID="$NEXT_BUILD_ID" \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
    npm run build

# ---- Runner -------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# tini as PID 1: forwards signals (clean SIGTERM shutdown so in-flight requests and
# `after()` callbacks drain) and reaps zombies — things a bare `node` PID 1 doesn't do.
RUN apk add --no-cache tini

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output ships its own trimmed node_modules + server.js. Static assets
# and public/ are not included in it and must be copied alongside.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Liveness check hits the lightweight /api/health route (no rendering, no env deps),
# not the homepage. Reads PORT at runtime (so it follows a platform-injected port,
# e.g. Cloud Run's), and uses node's global fetch to send the optional bearer token
# from HEALTH_CHECK_TOKEN — when that var is unset the header is harmless and the
# route stays open. Exits non-zero on any non-2xx (e.g. a 404 from a bad token).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000;fetch('http://127.0.0.1:'+p+'/api/health',{headers:{Authorization:'Bearer '+(process.env.HEALTH_CHECK_TOKEN||'')}}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
