import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The "Create your organization" screen, step 2 of 4. Moved from /signup to /create-org
 * when the design-authored account step took over /signup.
 *
 * Visual + client-validation build only — Continue provisions nothing. These lock in the
 * rules that are easy to regress: the form never navigates, the portal-address hint tracks
 * the field live, and an error replaces that hint rather than stacking with it.
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
  await expect(page.locator("#signup-slug-hint")).toHaveText("northwind.servicedesk.pro");

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

test("a taken portal address blocks the advance", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  // The design's seeded address stands in for a taken one, so the default state is
  // deliberately not advanceable — the user has to choose a free address first.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#signup-slug-error")).toHaveText(
    "That address is taken. Try northwind-support.",
  );
  await expect(page).toHaveURL(/\/create-org$/);
});

test("a free portal address advances to /onboarding", async ({ page }) => {
  await page.goto("/create-org");
  await hydrated(page);
  await page.fill("#signup-slug", "northwind-support");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Three steps and your queue is live.",
  );
});
