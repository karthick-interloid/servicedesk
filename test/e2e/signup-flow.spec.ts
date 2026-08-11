import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The whole four-step signup chain, end to end:
 *   /signup (Your account) → /create-org (Organization) → /onboarding (steps 3 and 4)
 *
 * The first two are separate routes; the last two are in-page wizard steps. Every step feeds
 * the signup draft in sessionStorage; nothing is written to the database until "Finish setup".
 *
 * This test deliberately WALKS UP TO "Finish setup" AND STOPS. Clicking it would create a
 * real auth user, tenant, membership, subscription, business hours and SLA rows in whichever
 * Supabase project .env.local points at — a test suite must not leave that behind. Covering
 * the provisioning itself needs a disposable database (`supabase start` + `db reset`), which
 * is a separate integration suite.
 */
test("the signup chain runs from account to finish", async ({ page }) => {
  // --- step 1 of 4: account ---
  await page.goto("/signup");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
  await page.fill("#account-full-name", "Ada Lovelace");
  await page.fill("#account-email", "ada@acme.io");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correct-horse");
  await page.getByRole("button", { name: "Continue" }).click();

  // --- step 2 of 4: organization ---
  await expect(page).toHaveURL(/\/create-org$/);
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
  // Both fields open blank now that this screen provisions for real.
  await page.fill("#signup-name", "Acme EU Support");
  await page.fill("#signup-slug", "acme-eu");
  await page.getByRole("button", { name: "Continue" }).click();

  // --- steps 3 and 4 of 4: the onboarding wizard, in-page ---
  await expect(page).toHaveURL(/\/onboarding$/);
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("When is your team on shift?");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Set your first SLA targets");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Invite your agents");

  // The chain is reachable end to end and the final control is the provisioning one. NOT
  // clicked, for the reason in the file header.
  await expect(page.getByRole("button", { name: "Finish setup" })).toBeEnabled();
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("the draft carries earlier steps across the route transitions", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.fill("#account-full-name", "Ada Lovelace");
  await page.fill("#account-email", "ada@acme.io");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correct-horse");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/create-org$/);
  await hydrated(page);
  await page.fill("#signup-name", "Acme EU Support");
  await page.fill("#signup-slug", "acme-eu");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // Back to step 2 — the values come out of the draft rather than resetting to blank, which
  // is the whole reason the draft exists.
  await hydrated(page);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/create-org$/);
  await hydrated(page);
  await expect(page.locator("#signup-name")).toHaveValue("Acme EU Support");
  await expect(page.locator("#signup-slug")).toHaveValue("acme-eu");
});

test("the onboarding Back control returns to /create-org", async ({ page }) => {
  await page.goto("/onboarding");
  await hydrated(page);
  await page.getByRole("link", { name: "Back" }).click();

  await expect(page).toHaveURL(/\/create-org$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
});
