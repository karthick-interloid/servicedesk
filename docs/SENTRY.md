# Sentry: Logging In and Getting the Env Vars

This template ships with Sentry wired in (`src/instrumentation.ts`, `src/instrumentation-client.ts`, `next.config.ts`, `error.tsx`, `global-error.tsx` — see [IMPLEMENTATION.md](./IMPLEMENTATION.md#9-error-monitoring--sentry)), but it's inert until you provide real credentials. This doc covers getting those credentials.

## 1. Log in / create an account

Go to [sentry.io](https://sentry.io) and sign in (or create an account — the free Developer tier is enough for a starter project). If you're joining an existing org, ask an org admin to invite you instead of creating a new org.

## 2. Create a project (if one doesn't exist yet)

From the Sentry dashboard: **Projects → Create Project**. Pick **Next.js** as the platform, give it a name, and assign it to a team. This gives you an **org slug** and a **project slug** — both visible in the URL, e.g.:

```
https://sentry.io/organizations/<org-slug>/projects/<project-slug>/
```

## 3. Get the DSN

In the project you just created (or an existing one): **Settings → Client Keys (DSN)**. Copy the DSN — it looks like:

```
https://<public-key>@o<org-id>.ingest.<region>.sentry.io/<project-id>
```

This single value goes into **both**:

```bash
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

It's not a secret — it's meant to be public (it's embedded in client-side JS), but the two separate env vars exist because `instrumentation.ts` (server) and `instrumentation-client.ts` (browser) each read their own var, per Next.js convention for what's exposed to the client.

## 4. Get an auth token (optional — only for source map uploads)

Without this, Sentry still receives error events, but stack traces point at minified/bundled code instead of your original source. To fix that, `next.config.ts` uploads source maps to Sentry at build time — this needs a token with upload permission.

Go to **Settings → Organization Tokens** (org-level: `sentry.io/settings/<org-slug>/auth-tokens/`) → **Create New Token**. Copy the token (starts with `sntrys_...`) — Sentry only shows it once.

`<org-slug>` and `<project-slug>` are the same values from the DSN URL in step 3 (e.g. `sentry.io/organizations/interloid/projects/javascript-nextjs/` → org slug `interloid`, project slug `javascript-nextjs`).

```bash
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=<org-slug>
SENTRY_PROJECT=<project-slug>
```

## 5. Put it all in `.env.local`

```bash
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=<org-slug>
SENTRY_PROJECT=<project-slug>
SENTRY_AUTH_TOKEN=sntrys_...
```

`.env.local` is gitignored — these never get committed. In CI/production, set the same variables as secrets in your deployment platform (Vercel/GitHub Actions/etc.), not in a committed file.

## 6. Verify it's working

### Connectivity test (fastest — no server needed)

```bash
npm run sentry:test
```

Runs [`scripts/sentry-connectivity-test.mjs`](../scripts/sentry-connectivity-test.mjs): reads `SENTRY_DSN` from `.env.local`, sends one real error event straight to Sentry, and waits for delivery to be confirmed before exiting.

- **Fails immediately** with a clear message if `SENTRY_DSN` isn't set — nothing was sent.
- **Exits non-zero** if `Sentry.flush()` times out without confirming delivery — usually a bad DSN or no network access to `sentry.io`.
- **On success**, prints the event ID and a dashboard link:

  ```
  Event delivered.
  Event ID: 8646b9eeb5604f51b3f37818dbaf19e1
  https://sentry.io/organizations/<org-slug>/issues/?project=-1&query=kind%3Aconnectivity-test&sort=date&statsPeriod=90d
  ```

  Open that link — it's a **tag search** (`kind:connectivity-test`), not free text, so it reliably finds the event regardless of wording. Every run reports as a new event under the same issue, titled `SentryConnectivityTestError: Safe to ignore...`, so once you've found it once, you can just recheck that one issue's event count each time instead of re-searching.

  **Give it 5–10 minutes before assuming something's wrong.** The usage-stats page (accepted/filtered/rate-limited counts) updates quickly, but turning an accepted event into a visible Issue is a separate, slower processing step — on this project it's taken as long as 5–10 minutes, not the "a few seconds" you'd expect. Don't treat an empty Issues search right after running the script as a failure; recheck the usage-stats page first (§ below) to confirm the event was accepted, then wait before re-checking Issues.

  Simpler alternative — skip the link entirely: open your project's **Issues** tab in Sentry and type `SentryConnectivityTestError` into the search box. Because it's a real class name (not a generic `Error`), it's an exact, distinctive token — no tag syntax needed, and it won't collide with real app errors.

This script uses `@sentry/node` directly (not `@sentry/nextjs`) — outside of an actual Next.js build/request, `@sentry/nextjs`'s export surface is limited to Next-specific wrappers and doesn't expose `captureException`/`flush`. See the comment at the top of the script for details.

#### "No issues match your search" even though the CLI said "Event delivered"

`Sentry.flush()` returning success only means Sentry's ingest endpoint _accepted_ the event over the network — it doesn't guarantee the dashboard query you're looking at will surface it. Don't hand-build a filtered URL like `?project=<project-slug>&query=connectivity-test` — things break it silently instead of erroring:

- The issue-stream `project=` query param takes the project's **numeric ID**, not its slug. A slug there matches zero projects, so every result gets filtered out with no error.
- Free-text search tokenizes on whitespace — searching `connectivity-test` (hyphenated) won't match message text containing `connectivity test` (two words). This is why the script tags the event (`kind: "connectivity-test"`, exact-match search) instead of relying on the message text.

Use the `project=-1` (all projects) link the script prints instead, or just open the project in the Sentry UI directly and sort **Issues** by "First Seen"/newest.

### Full app checks

1. `npm run build` — if `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` are set, the build step takes noticeably longer (uploading source maps) and you'll see a new release show up under **Releases** in the Sentry dashboard.
2. Trigger a real error through the app: temporarily add a page that throws (`export const dynamic = "force-dynamic"; export default function Page() { throw new Error("test"); }`), hit it, then check **Issues** in your Sentry project for the event. Delete the test page afterward.
3. Confirm the response includes `sentry-trace` and `baggage` headers/meta tags — that means the SDK actually initialized with your DSN, not silently no-op'd.

## Rotating a token

If a `SENTRY_AUTH_TOKEN` is ever exposed (pasted somewhere it shouldn't be, committed by accident, etc.), revoke it immediately at `sentry.io/settings/<org-slug>/auth-tokens/` and generate a new one. It's scoped to release/source-map uploads, not full account access, but rotate it anyway — it costs nothing and closes the exposure.
