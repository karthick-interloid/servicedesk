This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), extended into a production-ready starter template.

## Getting Started

This project uses **Node 24** — see `.nvmrc`. If you use `nvm`, `fnm`, or `volta`, run `nvm use` (or equivalent) before installing.

Install dependencies (this also installs the Git hooks via Husky):

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Copy the environment variable template and fill in real values:

```bash
cp .env.example .env.local
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Inter](https://fonts.google.com/specimen/Inter), exposed as the `--font-sans` CSS variable in `src/app/layout.tsx`.

## Environment Variables

Environment variables are validated at startup via [`src/config/env.ts`](./src/config/env.ts) using `zod` — the app fails fast with a clear error if a required variable is missing or malformed, instead of failing silently at runtime.

- **`.env.example`** — committed template documenting every variable. Copy it to `.env.local` and fill in real values.
- **`.env.local`** — your real values (secrets, local overrides). Git-ignored, never committed.

| Variable                       | Scope           | Description                                                                    |
| ------------------------------ | --------------- | ------------------------------------------------------------------------------ |
| `SESSION_SECRET`               | Server-only     | Secret used to sign/encrypt session data.                                      |
| `NEXT_PUBLIC_API_URL`          | Client + server | Base URL the app uses to call the backend API.                                 |
| `NEXT_PUBLIC_SITE_URL`         | Client + server | Canonical deployed URL, used for SEO (`metadataBase`, sitemap, robots).        |
| `NEXT_PUBLIC_SITE_NAME`        | Client + server | Site name, used in the title template and OG/Twitter metadata.                 |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Client + server | Default meta description for pages that don't set their own.                   |
| `NEXT_PUBLIC_TWITTER_HANDLE`   | Client + server | Optional `@handle` for the `twitter:site` tag.                                 |
| `SENTRY_DSN`                   | Server-only     | Optional. Server/edge error reporting. See [docs/SENTRY.md](./docs/SENTRY.md). |
| `NEXT_PUBLIC_SENTRY_DSN`       | Client + server | Optional. Same DSN as above, for browser error reporting.                      |
| `SENTRY_ORG`                   | Server-only     | Optional. Org slug, used only at build time to upload source maps.             |
| `SENTRY_PROJECT`               | Server-only     | Optional. Project slug, used only at build time to upload source maps.         |
| `SENTRY_AUTH_TOKEN`            | Server-only     | Optional. Auth token, used only at build time to upload source maps.           |

Server-only variables are never sent to the browser. Client-exposed variables must be prefixed with `NEXT_PUBLIC_` and are inlined into the JS bundle at build time — never put secrets in a `NEXT_PUBLIC_` variable.

When adding a new variable: add it to `.env.local`, add its field to the schema in `src/config/env.ts`, document it in `.env.example`, **and** add it to the `env:` block in `.github/workflows/ci.yml` with a safe fallback value (`${{ vars.X || 'placeholder' }}` for non-sensitive vars, `${{ secrets.X }}` for sensitive ones) — CI lists every var explicitly rather than reading `.env.example`, so this last step doesn't happen automatically.

## Available Scripts

```bash
npm run dev            # start dev server
npm run build           # production build
npm run start           # start production server (after build)
npm run lint             # run ESLint
npm run typecheck        # run TypeScript compiler checks (no output)
npm run format           # format the whole repo with Prettier
npm run format:check     # check formatting without writing (used in CI)
npm run test             # run unit/component tests once (Vitest)
npm run test:watch       # run Vitest in watch mode
npm run test:coverage    # run unit tests and print a V8 coverage report
npm run test:e2e         # run end-to-end tests (Playwright)
npm run test:e2e:ui      # run Playwright in interactive UI mode
npm run sentry:test      # send a test event to Sentry and confirm delivery
```

## Tooling in this template

This starter is set up with production-oriented tooling beyond the default `create-next-app` output:

- **ESLint + Prettier** (with `prettier-plugin-tailwindcss` for automatic Tailwind class sorting)
- **Husky + lint-staged** — pre-commit runs lint/format on staged files; pre-push runs a full typecheck + build
- **SEO** — env-driven metadata (`src/config/site.ts`), `robots.ts`, `sitemap.ts`, a generated `opengraph-image`/`twitter-image`, and `WebSite` JSON-LD
- **Error handling** — `not-found.tsx`, `error.tsx`, `global-error.tsx`, with optional Sentry error reporting (see [docs/SENTRY.md](./docs/SENTRY.md))
- **Loading UI** — `loading.tsx` streams a skeleton fallback (shadcn's `Skeleton` primitive) while async route data resolves
- **Testing** — Vitest + React Testing Library for unit/component tests, Playwright for E2E, with V8 coverage. Tests live under `test/` (mirroring `src/`), E2E specs under `test/e2e/`. See [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md#14-testing--vitest--playwright)
- **Security headers** — CSP, HSTS, and 4 others applied to every route via `next.config.ts` (see [docs/LEARN.md](./docs/LEARN.md#security-headers--what-each-one-actually-stops) for what each one defends against)
- **Docker** — multi-stage `Dockerfile` + `docker-compose.yml` building a minimal standalone image (`output: "standalone"`). See [Docker](#docker) below and [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md#15-docker)
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — lint, format check, typecheck, and build on every PR and push to `main`
- **`.nvmrc`** — pins the Node version used locally and in CI

For a full breakdown of what's been implemented and why, see the docs in [`docs/`](./docs):

- **[docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)** — what's set up, what's still pending, and where each script/hook/workflow lives
- **[docs/LEARN.md](./docs/LEARN.md)** — plain-English explanations of how each piece of tooling actually works (Git hooks, lint-staged, CI concepts, path aliases, etc.)
- **[docs/SENTRY.md](./docs/SENTRY.md)** — how to log in to Sentry and get the DSN/tokens this template's error monitoring needs
- **[docs/CONVENTIONS.md](./docs/CONVENTIONS.md)** — the `src/` folder layout and where new code (components, hooks, types, schemas, features) should go
- **[docs/COMMANDS.md](./docs/COMMANDS.md)** — a quick cheat-sheet of every `npm`/Docker command and what it does

## Docker

Run the app in a container. It uses a small production image (Next.js standalone output, `node:24-alpine`, non-root user, about 268 MB).

```bash
cp .env.example .env.local     # create your env file, then fill in real values
docker compose up --build      # build and start on http://localhost:3000
```

Without Compose:

```bash
npm run docker:build           # build the image
npm run docker:run             # run it (uses --env-file .env.local) on :3000
```

### Environment variables

There are two kinds, and they work differently:

- **`NEXT_PUBLIC_*` variables** are put into the app when you **build** the image. To change them, you have to build again.
- **Server-only variables** (like `SESSION_SECRET` and `SENTRY_DSN`) are read when the app **starts**. You set them at run time (`--env-file` / compose `env_file`).

The app checks its variables when it starts and will not start if a required one is missing. So every required variable must also be set at run time, not only at build time.

### Health check

The app has a URL that tells you if it is running: **`GET /api/health`**. When the app is up, it returns `{"status":"ok"}`. Docker, Kubernetes, and load balancers use this URL to know the container is alive.

By default the URL is **open** — anyone can open it in a browser.

You can make it **private** by setting `HEALTH_CHECK_TOKEN`. After that:

| Request                                    | Result                                     |
| ------------------------------------------ | ------------------------------------------ |
| Has header `Authorization: Bearer <token>` | `200` and `{"status":"ok"}`                |
| No header, or wrong token                  | `404` (looks like the page does not exist) |

A normal **browser cannot send that header**, so once a token is set, opening the URL in a browser will always show **404**. That is expected, not a bug — use `curl` or Postman with the header instead. Docker sends the token automatically.

> Tip: leave `HEALTH_CHECK_TOKEN` **empty during local development** so the browser can open the URL. Set it only in production, where you want the health URL to be private.

**Running more than one replica?** Set `NEXT_BUILD_ID` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (build args) to fixed values shared across all replicas, or you'll hit version-skew and "Failed to find Server Action" errors. They're optional and can stay empty for a single container. Full rationale in [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md#15-docker).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
