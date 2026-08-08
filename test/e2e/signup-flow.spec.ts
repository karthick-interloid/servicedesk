import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The whole four-step signup chain, end to end:
 *   /signup (Your account) → /create-org (Organization) → /onboarding (steps 3 and 4)
 *
 * The first two are separate routes; the last two are in-page wizard steps. Nothing is
 * provisioned anywhere along it — the only side effects are route transitions and React
 * state.
 */
test("the signup chain runs from account to finish", async ({ page }) => {
  // --- step 1 of 4: account ---
  await page.goto("/signup");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
  await page.fill("#account-email", "ada@acme.io");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correct-horse");
  await page.getByRole("button", { name: "Continue" }).click();

  // --- step 2 of 4: organization ---
  await expect(page).toHaveURL(/\/create-org$/);
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
  // The seeded address is simulated as taken, so pick a free one.
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

  // Finish provisions nothing and stays put.
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("the onboarding Back control returns to /create-org", async ({ page }) => {
  await page.goto("/onboarding");
  await hydrated(page);
  await page.getByRole("link", { name: "Back" }).click();

  await expect(page).toHaveURL(/\/create-org$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
});
