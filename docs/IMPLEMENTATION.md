# Implementation Log

This document tracks what has been set up in this template so far, and why. Update it whenever a new piece of tooling is added.

## Stack

- Next.js 16.2.11 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`)
- npm (see `package-lock.json`)
- Node 24 (see `.nvmrc`)

## 1. Formatting — Prettier

**Files:** `.prettierrc.json`, `.prettierignore`

- `prettier` formats all supported files (JS/TS/JSON/CSS/MD/YAML).
- `prettier-plugin-tailwindcss` automatically sorts Tailwind utility classes into Tailwind's recommended order. It's pointed at `./src/app/globals.css` via `tailwindStylesheet` since this project uses Tailwind v4's CSS-based config.
- `eslint-config-prettier` is added to `eslint.config.mjs` to disable any ESLint formatting rules that would conflict with Prettier — ESLint handles code-quality rules, Prettier handles style.

**Scripts** (`package.json`):

```bash
npm run format         # formats the whole repo
npm run format:check   # checks formatting without writing (used in CI)
```

## 2. Linting — ESLint

**Files:** `eslint.config.mjs` (flat config)

- Built on `eslint-config-next` (core web vitals + TypeScript rules), which includes `eslint-plugin-jsx-a11y` for accessibility linting.
- `eslintConfigPrettier` added last in the config array so it overrides any conflicting stylistic rules from the Next.js config.

```bash
npm run lint
```

## 3. Type checking

**Files:** `tsconfig.json`

- `strict: true` already enabled.
- Extra strict flags on top of `strict: true`: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`. See [LEARN.md](./LEARN.md#the-extra-strict-tsconfig-flags) for what each one catches.
- `@/*` path alias maps to `./src/*` (e.g. `import { x } from "@/lib/x"`).

```bash
npm run typecheck   # tsc --noEmit
```

## 4. Git hooks — Husky + lint-staged

**Files:** `.husky/pre-commit`, `.husky/pre-push`, `.lintstagedrc.json`

Husky wires shell scripts into Git's hook system via `core.hooksPath`. This is installed automatically by the `prepare` script in `package.json`, which runs on every `npm install`.

### `pre-commit`

```
npx lint-staged
```

Runs `lint-staged`, which reads `.lintstagedrc.json` and runs commands **only against files currently staged for commit** (fast, incremental — not a full-repo check):

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint"],
  "*.{js,jsx,ts,tsx,json,css,md,yml,yaml}": ["prettier --write"]
}
```

`eslint` runs without `--fix` on purpose — it only reports errors and fails the commit, it never silently rewrites staged code. `prettier --write` is the one command here that does modify files (formatting only, not logic), and when it does, lint-staged re-stages the result automatically. If any command fails (including plain `eslint` finding a lint error), lint-staged reverts to the pre-commit state and aborts the commit (nothing partial is ever committed).

### `pre-push`

```
npm run typecheck && npm run build
```

Runs a heavier check before code leaves the machine — a full TypeScript check and a production build. This catches issues pre-commit can't (pre-commit only touches staged files, so it can miss cross-file type errors).

## 5. SEO

**Files:** `src/config/site.ts`, `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`

- `src/config/site.ts` exports `siteConfig`, read from the SEO env vars in `src/config/env.ts` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`, `NEXT_PUBLIC_TWITTER_HANDLE`) — nothing SEO-related is hardcoded, so the same code produces correct metadata per environment (local/staging/prod) just by changing env vars.
- Root `metadata` in `layout.tsx` sets `metadataBase` (so relative OG/canonical URLs resolve correctly), a title template (`%s | <site name>`), description, Open Graph, `twitter: { card: "summary_large_image" }`, and `robots: { index: true, follow: true }`.
- `robots.ts` and `sitemap.ts` are Next.js file-convention routes — they generate `/robots.txt` and `/sitemap.xml` at build time, both driven by `NEXT_PUBLIC_SITE_URL`.
- `opengraph-image.tsx` generates a real `og:image` (1200×630 PNG) at build time using `next/og`'s `ImageResponse`, rendering `siteConfig.name`. `twitter-image.tsx` re-exports it so `twitter:image` uses the same generated image instead of duplicating the render logic.
- A `WebSite` JSON-LD `<script type="application/ld+json">` block is emitted in `layout.tsx`'s `<body>`, built from `siteConfig` — gives search engines structured data beyond plain meta tags.
- **Per-page metadata** — `src/app/about/page.tsx` is a real sample route (not just docs prose) demonstrating the pattern documented in `docs/LEARN.md#overriding-metadata-per-page`: a page-level `metadata` export overrides `title`/`description`/`openGraph` for just that route, while everything else (error boundaries, security headers, the root layout) still applies automatically since nothing about routing or config changes. Also added to `sitemap.ts`.
- **Verified for real:** built, started the production server, and `curl`'d both `/` and `/about` — confirmed `/about`'s `<title>` correctly cascades through the root template (`About | Starter Template`), its OG tags are fully overridden (not merged/leaked from the root), the homepage's title is unaffected (proves no cross-route leakage), `og:url` resolves correctly against `metadataBase`, `sitemap.xml` lists both URLs, and the global security headers (`Content-Security-Policy`, etc.) apply to `/about` with zero extra config.

## 6. CI — GitHub Actions

**Files:** `.github/workflows/ci.yml`

Runs on every pull request and every push to `main`:

1. Checkout code
2. Set up Node (version read from `.nvmrc` via `node-version-file`)
3. `npm ci` — clean, lockfile-strict install
4. `npm run lint`
5. `npm run format:check`
6. `npm run typecheck`
7. `npm run build` — every var `src/config/env.ts`'s `zod` schema can see is listed explicitly in this step's `env:` block, so the file is self-contained (no dependency on `.env.example` staying in sync). Each has a safe fallback via `||`, so CI is green with zero setup on a fresh fork:
   - **Required** (`SESSION_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`) fall back to the same placeholder values `.env.example` documents.
   - **Optional** (`NEXT_PUBLIC_TWITTER_HANDLE`, `SENTRY_*`, `NEXT_PUBLIC_SENTRY_DSN`) default to blank, matching their optional status in the schema — Sentry simply stays off in CI unless configured.
   - Non-sensitive values read from `${{ vars.X }}`, sensitive ones (`SESSION_SECRET`, `SENTRY_AUTH_TOKEN`) from `${{ secrets.X }}` — both overridable for real via repo **Settings → Secrets and variables → Actions**, without editing `ci.yml`.

A second job, `docker`, runs in parallel: it builds the production image to verify the Dockerfile stays buildable (details in the Docker section below).

This is the real enforcement layer — local hooks can be bypassed (`--no-verify`) or skipped by contributors who never ran `npm install`, so CI re-runs everything unconditionally. For this to actually block bad merges, enable **branch protection** on `main` in GitHub repo settings requiring the `CI` check to pass.

**Verified for real:** deleted `.env.local` entirely and ran `npm run build` with only the fallback env values set (simulating zero GitHub UI configuration) — succeeded, proving the fallback path alone is sufficient without any dotenv file present. Then restored the real `.env.local` and diffed it byte-for-byte against a backup to confirm nothing was lost.

**Earlier approach, superseded:** an intermediate version copied `.env.example` to `.env.local` before building, so new vars would flow into CI automatically. Dropped in favor of full explicitness after a stale CI run (from a commit predating the first env fix) surfaced confusion about which vars CI actually saw — listing everything directly in `ci.yml` means there's exactly one place to look, with no dependency on a second file staying in sync.

### Still to add to CI (discussed, not yet implemented)

- `concurrency` group to cancel superseded runs
- explicit `permissions: contents: read`
- `.next/cache` caching for faster builds
- a test step — the runner now exists (see the Testing section), so `npm run test` (and optionally `npm run test:e2e`) can be added as a CI step; not wired in yet

## 7. Node version pinning

**Files:** `.nvmrc` → `24.15.0`

Ensures local dev and CI use the same Node version. CI reads this file directly via `node-version-file: ".nvmrc"` in `actions/setup-node`.

## 8. Error handling

**Files:** `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`

- `not-found.tsx` — rendered when `notFound()` is called in a route segment, or a URL doesn't match any route. Returns a `404` status.
- `error.tsx` — a React error boundary (`'use client'`) that wraps `not-found.tsx`, `loading.tsx`, `page.tsx`, and nested `layout.tsx` files in the same segment. Catches uncaught exceptions during rendering and shows fallback UI instead of crashing the tree. This version of Next.js exposes `unstable_retry()` (re-fetches and re-renders the boundary's children) instead of the classic `reset()`.
- `global-error.tsx` — catches errors thrown in the root `layout.tsx` itself, which `error.tsx` can't reach. Must define its own `<html>`/`<body>` and import `globals.css` directly, since it fully replaces the root layout when active.
- Both `error.tsx` and `global-error.tsx` display `error.digest` in the fallback UI — a hash users can quote in a support request, matched against server logs or Sentry.

See [SENTRY.md](./SENTRY.md) for how errors caught here get reported.

## 9. Error monitoring — Sentry

**Files:** `src/instrumentation-client.ts`, `src/instrumentation.ts`, `next.config.ts`, `src/app/error.tsx`, `src/app/global-error.tsx`, `scripts/sentry-connectivity-test.mjs`

- `instrumentation-client.ts` — Next.js file convention, runs before React hydrates in the browser. Initializes the Sentry client SDK (only if `NEXT_PUBLIC_SENTRY_DSN` is set) and reports router-transition navigation events.
- `instrumentation.ts` — Next.js file convention, `register()` runs once when a server instance boots. Initializes the Sentry server/edge SDK (only if `SENTRY_DSN` is set), branching on `process.env.NEXT_RUNTIME`. Also exports `onRequestError`, which Next.js calls for any uncaught error in Server Components, Route Handlers, or Server Actions — wired to `Sentry.captureRequestError`.
- `next.config.ts` — wrapped with `withSentryConfig`, which uploads source maps to Sentry at build time so stack traces are readable, but only if `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` are all present. Without them it's a silent no-op.
- `error.tsx` / `global-error.tsx` — call `Sentry.captureException(error)` in a `useEffect`, in addition to `console.error`.
- Every Sentry env var is optional and gated — with none set, the app builds and runs exactly as if Sentry weren't installed.
- `npm run sentry:test` runs `scripts/sentry-connectivity-test.mjs`, a standalone Node script (via `@sentry/node`, not `@sentry/nextjs`) that sends one real event to Sentry and confirms delivery — the fastest way to check `SENTRY_DSN` is correct without spinning up the app.

Setup and connectivity-test instructions (login, DSN, tokens): [SENTRY.md](./SENTRY.md).

## 10. Security headers

**Files:** `next.config.ts`

- A static (no-nonce) Content-Security-Policy plus `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, applied to every route via `headers()`.
- **No-nonce, deliberately.** This fork renames `middleware.ts` to `proxy.ts`, and nonce-based CSP requires every page to render dynamically through it — which would take the homepage and every other currently-static route off static generation. The static CSP is Next.js's own documented alternative for exactly this tradeoff.
- `script-src`/`style-src` include `'unsafe-inline'` — required because Next.js's App Router injects inline bootstrap/streaming scripts (`__next_f.push(...)`) by design when not using nonces. This isn't a shortcut; it's the documented "without nonces" pattern.
- `connect-src` includes the exact Sentry ingest host, **derived from `NEXT_PUBLIC_SENTRY_DSN` at build time** rather than a wildcard (`https://*.sentry.io`) — the real ingest host has 3 subdomain labels (`o<id>.ingest.<region>.sentry.io`), and CSP wildcard matching across multiple labels isn't reliable enough to trust blindly for something that would silently break error reporting if wrong.
- Verified for real: built, started the production server, and confirmed via `curl -I` that all 6 headers are present on both a static route and the 404 page, that the CSP resolves to the literal Sentry host (not the wildcard), and that every resource the homepage actually loads (`grep`'d out of the rendered HTML) is same-origin — nothing the CSP would block.
- Not done: nonce-based CSP as an opt-in upgrade path for apps that need stricter `script-src`/`style-src` (no `'unsafe-inline'`) and are willing to trade static generation for it. See Next.js's CSP guide (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) if that tradeoff becomes worth it later.

## 11. Dependency vulnerability fixes

**Files:** `package.json` (`overrides`)

- `npm audit` flagged `brace-expansion` (high) via `eslint`'s own transitive chain — fixed by plain `npm audit fix` (no `--force`), a non-breaking patch bump.
- `postcss` (moderate) and `sharp` (high) were flagged too, but only in **`next`'s own nested/bundled copies** (`node_modules/next/node_modules/postcss`, `next`'s bundled `sharp`) — the top-level copies (`@tailwindcss/postcss`, `shadcn`) were already on safe versions. `npm audit fix --force`'s suggested "fix" for both was to downgrade `next` to `9.3.3` — nonsensical for a Next 16 App Router codebase and never applied. Fixed properly instead via `overrides` in `package.json` (`postcss: ^8.5.16`, `sharp: ^0.35.3`), which forces the safe version everywhere, including inside `next`'s own resolution, without touching `next` itself. Confirmed via `npm ls postcss sharp` that both dedupe to the safe version under `next` after `npm install`.
- One remaining, accepted: `@hono/node-server` (moderate, path traversal in `serve-static` on Windows) via `shadcn → @modelcontextprotocol/sdk → @hono/node-server`. This is exclusively `shadcn`'s own CLI/MCP tooling — never bundled into the shipped app, never network-reachable in production. `npm audit fix --force`'s suggested fix is to _downgrade_ `shadcn` (from `4.14.0` to `3.8.3`), which is npm's resolver failing to find a real fix rather than one existing — not applied.
- Verified after the override: `npm install` (clean, 0 extraction errors), `tsc --noEmit`, `eslint .`, and `npm run build` all still pass.

Not done: automated recurring scanning (Dependabot/Renovate config, `npm audit` as a CI step) — this was a one-time manual pass, not an ongoing gate. New vulnerabilities introduced later won't be caught until someone runs `npm audit` again by hand.

## 12. Loading UI

**Files:** `src/app/loading.tsx`, `src/skeletons/home.tsx`, `src/components/ui/skeleton.tsx`

- `loading.tsx` — Next.js file convention, fixed location (same constraint as `instrumentation.ts`: it must live at the exact route path, or Next.js silently never wires up the `<Suspense>` boundary — no error, the feature just doesn't exist). Wraps `page.tsx` (and nested `layout.tsx`/`not-found.tsx`) in Suspense; Next.js streams this fallback immediately, then swaps in the real content once any async data in the route resolves. Only fires when something in the route actually suspends (an `await` in an async Server Component) — a page with no async data, like the current homepage, never shows it.
- Since `loading.tsx` can't move, it's kept as a thin file that imports and renders `HomeSkeleton` from `src/skeletons/home.tsx` — the actual markup lives in the freely-organizable `skeletons/` folder per `docs/CONVENTIONS.md`, `loading.tsx` itself is just the required entry point. `skeletons/home.tsx`'s `.gitkeep` was removed since it now has a real file.
- `skeleton.tsx` (`components/ui/`) — added via `npx shadcn add skeleton`, not hand-written, so it matches the project's existing shadcn conventions exactly (`data-slot`, `cn()`-merged `className`, `bg-muted`/`animate-pulse`). This is the **small, single-primitive** building block; `skeletons/home.tsx` composes it into the actual route-shaped layout, per `docs/CONVENTIONS.md`'s distinction between the two folders.
- `HomeSkeleton` still renders 3 generic bars — now stale since §13 gave the homepage real hero/features content, but harmless: `page.tsx` has no async data fetch, so `loading.tsx` never actually fires yet. Worth reshaping to mirror the real layout (headline-width bar + a row per feature card) the day the homepage gains real async data and this Suspense boundary starts firing for real.
- **Verified for real, not just built** — twice, once before and once after splitting the file: temporarily made `page.tsx` an async Server Component with an artificial 2-second delay (`force-dynamic` to bypass static prerendering), started the production server, and confirmed via `curl` that the initial streamed HTML response actually contains the skeleton markup (`animate-pulse rounded-md bg-muted`, all 3 bars) while the delayed data was still resolving — proving the Suspense boundary genuinely fires, not just that the file compiles. Reverted `page.tsx` back to its original static form afterward both times.

## 13. Design system adopted from interloid.com, real Home/About content

**Files:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/about/page.tsx`

- **Design tokens are real, not guessed.** Fetched `https://www.interloid.com/`'s compiled CSS directly (`curl`, then grepped for `--color-*`/`--primary`/etc.) rather than eyeballing the rendered page — got their actual `:root` custom properties: primary `#1f5da0`, accent `#289dbe`, dark `#0f172a`, a full slate neutral scale, and a `0.75rem`/12px base radius. Mapped those directly into this template's existing shadcn CSS-variable structure (`--primary`, `--accent`, `--muted`, etc. in `globals.css`) — same variable names, new values, so every component already built on those tokens (buttons, the skeleton primitive, etc.) picked up the new palette with zero changes elsewhere.
- **Typeface deliberately not adopted** — interloid.com uses a system-font stack (`-apple-system, BlinkMacSystemFont, ...`) for performance; this template keeps `next/font`'s `Inter`. That's a delivery-mechanism choice, not part of the brand identity being adopted, so it wasn't changed.
- **Dark mode values are derived, not copied** — interloid.com's own dark-mode tokens (`--destructive: #ff6568`, `--border: #ffffff1a`) were reused directly where available; `--primary`/`--ring` were lightened to `#3d7cc9` for adequate contrast against the dark background, since the light-mode blue wasn't tested against a dark navy background on the source site.
- **Copy is original, not copied.** `page.tsx`'s hero headline/subheadline/feature copy and `about/page.tsx`'s content are written fresh for this template, in a similar confident/concrete tone to interloid.com's marketing copy (concrete claims, short sentences) — their actual business copy is their content/IP and wasn't reused verbatim.
- `page.tsx` (previously an empty `<div></div>`) now has a real hero section (headline, subheadline, dual CTA, trust badges) and a 3-column feature grid describing this template's actual verified features (security headers, error monitoring, CI) — not placeholder lorem ipsum.
- **Verified for real:** built, started the production server, and `curl`'d the actual rendered output — confirmed the real headline text renders, the exact adopted hex `#1f5da0` is present in the compiled CSS served to the browser (not just written in source), and that both the `/about` canonical-URL fix (§5) and global security headers (§10) still apply correctly on top of the new content.
- **Not done this pass:** a Playwright-driven visual screenshot comparison against the reference site. Skipped deliberately — running a temporary `npm install`/`uninstall` for a one-off browser tool is exactly what caused the npm-11-vs-12 lockfile regression during the earlier Web Vitals investigation (see git history), and repeating that risk for a visual nice-to-have wasn't worth it. The `curl`-based checks above verify correctness (content, exact colors, headers); they don't verify pixel-level visual fidelity to the reference. Run `npm run dev` and compare by eye if that level of confirmation matters.

## 14. Testing — Vitest + Playwright

**Files:** `vitest.config.mts`, `vitest.setup.ts`, `playwright.config.ts`, `test/**`

Two layers, split by what each can actually reach:

- **Unit / component — Vitest + React Testing Library.** Chosen over Jest: ESM-native (matches this Next 16 / Tailwind v4 setup), faster, first-class TS, minimal config. `vitest.config.mts` uses the `jsdom` environment, `globals: true`, `@vitejs/plugin-react`, and `vite-tsconfig-paths` (so `@/*` resolves in tests). `vitest.setup.ts` registers `@testing-library/jest-dom` matchers. Tests live in `test/**/*.{test,spec}.{ts,tsx}`, mirroring `src/`; `test/e2e/**` is excluded so Playwright specs never run under Vitest.
- **End-to-end — Playwright.** Chosen over Cypress: faster, real multi-browser, and the way Next.js's own docs recommend covering `async` Server Components (which Vitest/RTL can't render). `playwright.config.ts` sets `testDir: ./test/e2e`, a `baseURL` of `http://localhost:3000`, and a `webServer` that boots the app itself — `npm run dev` locally (reusing an already-running server), `npm run build && npm run start` in CI. Only the `chromium` project is enabled; Firefox/WebKit are commented in, pending `npx playwright install firefox webkit`.

**Env for tests.** `src/config/env.ts` validates `process.env` at import time and throws if a required var is missing, so any test importing `siteConfig` (robots, sitemap, the About page) would fail to load. `vitest.config.mts` provides valid dummy values via its `test.env` block — this is the test analogue of the CI `env:` block in §6, and must be kept in sync when a required env var is added.

**Coverage.** V8 provider (`@vitest/coverage-v8`), reporters `text` + `html` + `lcov`, output to `/coverage` (git-ignored). Measures `src/**`, excluding tests, type defs, `layout.tsx`, and instrumentation files. `npm run test:coverage`. The one intentionally-uncovered line is the `ImageResponse` render in `opengraph-image.tsx` — a `next/og` (satori/resvg) runtime concern that doesn't execute meaningfully in jsdom and is verified at build time instead; its metadata exports are tested.

**Scripts** (`package.json`): `test` (`vitest run`), `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`.

**Verified for real:** full suite green (unit + component + E2E), `tsc --noEmit` clean with the test files included, and coverage at ~98% statements. The E2E navigation spec was run against the real dev server (home → about), not just compiled.

Not done: wiring a test step into `.github/workflows/ci.yml` (see §6) and a coverage threshold gate — both discussed, neither committed yet.

## 15. Docker

**Files:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `next.config.ts` (`output: "standalone"`), `public/.gitkeep`

- **Standalone output.** `next.config.ts` sets `output: "standalone"`, so `next build` emits `.next/standalone/` — a trimmed server (`server.js`) plus only the traced `node_modules`, instead of the whole dependency tree. This is Next.js's own recommended base for a small Docker image (its `with-docker` example).
- **Multi-stage `Dockerfile`** (`node:24-alpine`, matching `.nvmrc`): `deps` (`npm ci` with a BuildKit `--mount=type=cache` so rebuilds don't re-download packages) → `builder` (`next build`) → `runner` (copies `.next/standalone`, `.next/static`, and `public/` only). Runs as a non-root `nextjs` user, binds `HOSTNAME=0.0.0.0` / `PORT=3000` (the standalone server defaults to localhost otherwise). `apk add libc6-compat` is included because `sharp` (image optimization) expects glibc symbols on Alpine/musl. (`npm ci` here, not `npm install` like CI — the Docker build is always Linux, so CI's lockfile-drift reason doesn't apply and a strict, reproducible install is what we want.)
- **`tini` as PID 1** (`ENTRYPOINT ["/sbin/tini","--"]`) so the container forwards `SIGTERM` for a clean shutdown (in-flight requests and `after()` callbacks drain) and reaps zombies — a bare `node` PID 1 does neither. Verified `ps` shows `tini` at PID 1 with `next-server` as its child.
- **Ports are dynamic.** The `HEALTHCHECK` reads `PORT` at runtime (so it follows a platform-injected port like Cloud Run's, instead of a hardcoded `3000`), and `docker-compose.yml` maps `${HOST_PORT:-3000}:3000`.
- **Base image pinned by digest** (`node:24-alpine@sha256:…`), not just the tag, so builds are reproducible. A comment in the Dockerfile shows the exact command to refresh the digest when you want a newer base.
- **`public/` was created** (empty, `.gitkeep`) because the runner stage copies it and the template had no `public/` dir — the `COPY` would otherwise fail.
- **Health check** hits a dedicated `src/app/api/health/route.ts` (returns `{ status: "ok" }`, `force-dynamic`, reads `process.env` directly so it never depends on the validated env module) rather than the homepage — cheaper, and the same endpoint works for Kubernetes/load-balancer probes. The Dockerfile `HEALTHCHECK` uses a `node` + global-`fetch` one-liner. Covered by unit tests (`test/app/api/health.test.ts`).
- **Optional token protection on the health route.** Open by default (zero-config for Docker/k8s). If `HEALTH_CHECK_TOKEN` is set at runtime, the route requires `Authorization: Bearer <token>` and returns **404** otherwise — hidden as well as gated (a protected endpoint looks like it doesn't exist). The token is compared in constant time (`crypto.timingSafeEqual`), read straight from `process.env` (not validated by `config/env.ts`), and the `HEALTHCHECK` sends it automatically from the same env var, so a locked-down endpoint doesn't make the container report unhealthy. Documented in `.env.example`. **Verified for real:** ran the container both ways — open (200 + Docker `healthy`) and with `HEALTH_CHECK_TOKEN` set (404 with no/wrong token, 200 with the right Bearer token, Docker still `healthy` because the check sends the token).
- **Multi-instance safety.** `next.config.ts` adds `generateBuildId` (reads `NEXT_BUILD_ID`, else falls back to Next's default), and the Dockerfile threads both `NEXT_BUILD_ID` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as optional build args (scoped to the build command, empty by default). These do nothing for a single container, but when you run **more than one replica** of the same build they prevent version-skew and "Failed to find Server Action" errors — set both to fixed values across replicas. This is Next.js's own documented multi-server guidance, wired in ahead of need.
- **The build-time vs runtime env split is the subtle part.** `src/config/env.ts` validates `process.env` at import, and any prerendered route imports it (via `siteConfig`), so **all required vars must exist at build time** — they're passed as `ARG`s in the builder stage. On top of that, every `NEXT_PUBLIC_*` var is **inlined into the client bundle during `next build`**, so its value is baked into the image; changing it later at runtime does _not_ update the client bundle — you rebuild. `SESSION_SECRET` is the exception: server-only, never inlined, so its build `ARG` is a throwaway placeholder (the BuildKit `SecretsUsedInArgOrEnv` check is skipped deliberately for it via a `# check=skip=` directive) and the real value is injected at **runtime** via `--env-file` / compose `env_file`. Because `env.ts` re-validates on server startup too, the runtime environment must also carry every required var.
- **`docker-compose.yml`** wraps this: build args default to the same localhost values as `.env.example`/CI (overridable from the shell or a root `.env`), and `.env.local` supplies runtime secrets via `env_file` (marked `required: false`, so a fresh clone without it doesn't hard-error — the app still refuses to boot if a required var is genuinely missing). Host port is `${HOST_PORT:-3000}`, and a commented `deploy.resources` block is there to uncomment for CPU/memory caps. `docker compose up --build` after `cp .env.example .env.local`.
- **Base-image / dependency freshness** is currently a manual concern — the base image is digest-pinned (reproducible but otherwise frozen), so refreshing it and the npm dependencies is a periodic manual pass (the Dockerfile comment shows how to refresh the digest). Automated update PRs (Dependabot/Renovate) are not wired up; add one if you want ongoing gating, with CI's image build gating each PR.
- **Scripts:** `npm run docker:build`, `npm run docker:run` (`--env-file .env.local`).
- **`.dockerignore`** keeps the build context small and — importantly — keeps `.env*` (secrets) out of the image; the build gets values through `ARG`s instead.
- **Image build check in CI.** `.github/workflows/ci.yml` has a separate `docker` job (parallel to `build`) that runs `docker build` to verify the Dockerfile stays buildable on every PR. The Dockerfile's build-arg defaults mean this needs no secrets — the image is only built, never run or pushed. (There's no image vulnerability scan wired in; add a container CVE scanner if you want that gating.)
- **Verified for real:** built the image (~268 MB), ran the container with `.env.local`, and confirmed via `curl` that `/` and `/about` return `200`, the homepage renders real hero content, all 6 security headers apply (CSP, HSTS, etc.) exactly as under `next start`, `sitemap.xml` generates, and the health route behaves correctly in both open and token-protected modes — Docker's own `HEALTHCHECK` reported `healthy` either way. Also confirmed `ps` shows `tini` at PID 1, `NEXT_BUILD_ID=… next build` writes that exact value to `.next/BUILD_ID`, and `docker compose config` validates. Removed the test container and image afterward.

Not done: publishing the image to a registry (the CI `docker` job builds + scans but does not push), and a shared cache handler for multi-instance ISR (`cacheHandler` → Redis) — deployment-specific, left to the fork that needs it.

## Not yet implemented (from the production checklist)

- Web Vitals reporting
- Deployment adapter decision (Next.js 16's adapters system)
- Import sorting (ESLint `import/order` or `@ianvs/prettier-plugin-sort-imports`)
- `npm audit` as a CI step (not gated in CI yet)
- Image vulnerability scanning in CI (a container CVE scanner on the built image — the `docker` job currently only verifies the image builds)
