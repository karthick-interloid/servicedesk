import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The "Create your organization" screen, step 2 of 4. Moved from /signup to /create-org
 * when the design-authored account step took over /signup.
 *
 * Continue still provisions nothing — it saves to the signup draft and advances. The
 * organization is created by "Finish setup" on /onboarding. These lock in the rules that are
 * easy to regress: the form never navigates on an invalid slug, the portal-address hint
 * tracks the field live, and an error replaces that hint rather than stacking with it.
 */

test("the create-org screen carries no app-shell chrome", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
});

test("the progress strip marks step 2 without relying on colour", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  const steps = page.locator('ol[aria-label="Setup progress"] li');
  await expect(steps).toHaveCount(4);
  // Every step carries its own number and label, and the current one is machine-readable.
  await expect(steps.nth(1)).toHaveAttribute("aria-current", "step");
  await expect(steps.nth(1)).toContainText("Organization");
  await expect(steps.nth(0)).not.toHaveAttribute("aria-current", "step");
});

test("the portal-address hint tracks the field and is replaced by its error", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  // Opens empty: the seeded "northwind" was dropped when this screen began provisioning a
  // real organization.
  await page.fill("#signup-slug", "acme-eu");
  await expect(page.locator("#signup-slug-hint")).toHaveText("acme-eu.servicedesk.pro");

  await page.fill("#signup-slug", "Acme EU!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#signup-slug-error")).toBeVisible();
  // Replaced, never stacked.
  await expect(page.locator("#signup-slug-hint")).toHaveCount(0);
  await expect(page.locator("#signup-slug")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/create-org$/);
});

test("the empty default state is not advanceable", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  // Both fields open blank now, so Continue reports them rather than advancing. Availability
  // is deliberately NOT checked here any more — `northwind` used to be hardcoded as taken,
  // and the real check runs against `tenants` during provisioning.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#signup-slug-error")).toHaveText("Enter a portal address");
  await expect(page).toHaveURL(/\/create-org$/);
});

test("a well-formed organization advances to /onboarding", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  await page.fill("#signup-name", "Northwind Support");
  await page.fill("#signup-slug", "northwind-support");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Three steps and your queue is live.",
  );
});
