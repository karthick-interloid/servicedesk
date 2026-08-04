# Commands

A quick reference for every command you'll use in this project, with a one-line note on what each does. For _why_ things are set up the way they are, see [IMPLEMENTATION.md](./IMPLEMENTATION.md).

## First-time setup

| Command                           | What it does                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `npm install`                     | Install dependencies and set up the Git hooks (Husky, via the `prepare` script).    |
| `cp .env.example .env.local`      | Create your local env file, then fill in real values (at minimum `SESSION_SECRET`). |
| `npx playwright install chromium` | Download the browser Playwright needs — required once before running E2E tests.     |

## Development

| Command         | What it does                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `npm run dev`   | Start the dev server with hot reload at http://localhost:3000.                  |
| `npm run build` | Create an optimized production build (also emits the Docker standalone output). |
| `npm run start` | Serve the production build locally — run `npm run build` first.                 |

## Code quality

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run lint`         | Run ESLint to catch code-quality and accessibility issues.       |
| `npm run typecheck`    | Type-check the whole project with TypeScript (no files emitted). |
| `npm run format`       | Auto-format the entire repo with Prettier.                       |
| `npm run format:check` | Check formatting without changing files (this is what CI runs).  |

## Testing

| Command                 | What it does                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm test`              | Run the unit/component tests once (Vitest).                                                               |
| `npm run test:watch`    | Run Vitest in watch mode — re-runs affected tests as you edit.                                            |
| `npm run test:coverage` | Run the unit tests and print a coverage report (also written to `/coverage`, open `coverage/index.html`). |
| `npm run test:e2e`      | Run the end-to-end tests (Playwright) — it boots the app automatically.                                   |
| `npm run test:e2e:ui`   | Run Playwright in interactive UI mode for debugging.                                                      |

## Docker

| Command                     | What it does                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| `npm run docker:build`      | Build the production Docker image, tagged `starter-template`.         |
| `npm run docker:run`        | Run that image on http://localhost:3000 with `.env.local` as its env. |
| `docker compose up --build` | Build and run via Compose (reads runtime env from `.env.local`).      |
| `docker compose down`       | Stop and remove the Compose containers.                               |

> Docker note: `NEXT_PUBLIC_*` values are baked into the image at build time; server-only secrets are read at runtime from `.env.local`. See the Docker section of [IMPLEMENTATION.md](./IMPLEMENTATION.md) for details.

## Other

| Command               | What it does                                                                          |
| --------------------- | ------------------------------------------------------------------------------------- |
| `npm run sentry:test` | Send one test event to Sentry to confirm your DSN/connectivity works.                 |
| `npm run prepare`     | Install Husky Git hooks — runs automatically after `npm install`; rarely run by hand. |
