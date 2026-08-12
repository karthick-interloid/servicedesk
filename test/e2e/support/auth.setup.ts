import { expect, test as setup } from "@playwright/test";

import { AUTH_STATE, e2eCredentials } from "./auth";

/**
 * Sign in once, through the REAL login form, and save the session for the specs that need
 * one. Runs as its own Playwright project, which every authenticated spec declares as a
 * dependency — so the sign-in happens once per run rather than once per test.
 *
 * It deliberately drives the form rather than minting a token with supabase-js: the thing
 * under test in every downstream spec is the app as a browser reaches it, and a synthetic
 * cookie would skip `proxy.ts`, the callback route and the session refresh that the real
 * path exercises.
 *
 * With no credentials configured this writes an EMPTY storage state and the specs that
 * depend on it skip themselves — see `requireE2eAuth`. That keeps a fresh checkout (and CI
 * without secrets) green instead of red for a reason that has nothing to do with the code.
 */
setup("authenticate", async ({ page }) => {
  const credentials = e2eCredentials();

  if (!credentials) {
    await page.context().storageState({ path: AUTH_STATE });
    setup.skip(true, "E2E_EMAIL / E2E_PASSWORD are not set — authenticated specs will skip.");
    return;
  }

  await page.goto("/login");
  await page.fill("#login-email", credentials.email);
  await page.fill("#login-password", credentials.password);
  await page.getByRole("button", { name: /^(Sign in|Continue)$/ }).click();

  // The shell is the proof the session took: `(app)/layout.tsx` renders the sidebar only
  // for a request that carried cookies, and an unauthenticated one lands back on /login.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
  await expect(page.getByRole("navigation").first()).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE });
});
