// Sends one test event to Sentry and confirms it was delivered.
// Usage: npm run sentry:test
//
// Uses @sentry/node directly rather than @sentry/nextjs: outside of a Next.js
// build/request, @sentry/nextjs's export surface is limited to its Next.js-specific
// wrappers (init, captureRequestError, wrapXWithSentry, ...) and doesn't include
// captureException/flush. @sentry/node is the underlying SDK @sentry/nextjs uses
// server-side and has the full API this script needs.
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (!dsn) {
  console.error("SENTRY_DSN is not set in .env.local — nothing to test.");
  console.error("See docs/SENTRY.md for how to get a DSN.");
  process.exit(1);
}

Sentry.init({
  dsn,
  environment: "connectivity-test",
  tracesSampleRate: 0,
});

// Named class (not plain Error) so Sentry titles the issue
// "SentryConnectivityTestError: ..." — an exact, easy-to-search token that
// won't get lost among real app errors or bitten by free-text tokenizing
// (e.g. "connectivity-test" vs "connectivity test" not matching).
class SentryConnectivityTestError extends Error {
  name = "SentryConnectivityTestError";
}

// Stable message (no per-run timestamp) so every run groups into the SAME
// Sentry issue instead of creating a new one each time — just watch that
// issue's event count go up. Per-run details live in the tag/extra below.
const eventId = Sentry.captureException(
  new SentryConnectivityTestError(
    "Safe to ignore — sent by scripts/sentry-connectivity-test.mjs to verify Sentry connectivity.",
  ),
  (scope) => {
    scope.setTag("kind", "connectivity-test");
    scope.setExtra("ranAt", new Date().toISOString());
    return scope;
  },
);

console.log(`Captured test event: ${eventId}`);
console.log("Flushing to Sentry...");

const delivered = await Sentry.flush(1000);

if (!delivered) {
  console.error("Sentry.flush() timed out — event was not confirmed delivered.");
  console.error(
    "Check that SENTRY_DSN is correct and this machine has network access to sentry.io.",
  );
  process.exit(1);
}

const org = process.env.SENTRY_ORG ?? "<your-org-slug>";

console.log("Event delivered.");
console.log(`Event ID: ${eventId}`);
console.log("");
console.log(
  "Sentry's ingest API accepted the event, which confirms the DSN and network path work.",
);
console.log(
  "Search by tag to find it in the dashboard — tag search is exact-match, unlike free text,",
);
console.log("so it won't miss due to wording/spacing:");
console.log("");
console.log(
  `  https://sentry.io/organizations/${org}/issues/?project=-1&query=kind%3Aconnectivity-test&sort=date&statsPeriod=90d`,
);
console.log("");
console.log(
  'Every run lands in the SAME issue — "SentryConnectivityTestError: Safe to ignore..." —',
);
console.log(
  "so you don't need a new search each time; just check that issue's event count went up.",
);
console.log("");
console.log("Give it 5-10 minutes before assuming it's missing — turning an accepted event into a");
console.log("visible Issue is a separate, slower processing step than ingest acceptance.");
console.log("");
console.log("Note: don't build your own filtered link by hand — Sentry's issue-stream `project=`");
console.log(
  "query param takes a numeric project ID, not the project slug, so a slug there silently",
);
console.log(
  'matches nothing and the page shows "No issues match your search" even though the event arrived.',
);
