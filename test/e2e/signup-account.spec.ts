import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * Step 1 of 4 — the design-authored account screen. No provisioning happens; the only
 * side effect of a valid submit is a route transition to /create-org.
 */

test("the account screen carries no app-shell chrome and marks step 1", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);

  const steps = page.locator('ol[aria-label="Setup progress"] li');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(0)).toHaveAttribute("aria-current", "step");
  await expect(steps.nth(1)).not.toHaveAttribute("aria-current", "step");
});

test("an empty submit reports every field and does not navigate", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#account-email-error")).toHaveText("Enter your email address");
  await expect(page.locator("#account-password-error")).toHaveText("Enter a password");
  await expect(page.locator("#account-confirm-error")).toHaveText("Re-enter your password");
  // Errors replace hints, never stack alongside them.
  await expect(page.locator("#account-email-hint")).toHaveCount(0);
  await expect(page).toHaveURL(/\/signup$/);
});

test("field errors are independent", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.fill("#account-email", "not-an-email");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correct-horse");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#account-email-error")).toHaveText("Enter a valid email address");
  // The password pair validated, so those two keep their hints.
  await expect(page.locator("#account-password-hint")).toBeVisible();
  await expect(page.locator("#account-confirm-hint")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("a password mismatch blocks on the confirm field only", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.fill("#account-email", "ada@acme.io");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correcthorse");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#account-confirm-error")).toHaveText("Passwords don't match");
  await expect(page.locator("#account-password-hint")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("the reveal toggle flips the input type without touching the value", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.fill("#account-password", "correct-horse");
  await expect(page.locator("#account-password")).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.locator("#account-password")).toHaveAttribute("type", "text");
  await expect(page.locator("#account-password")).toHaveValue("correct-horse");

  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(page.locator("#account-password")).toHaveAttribute("type", "password");
});

test("a valid account advances to /create-org", async ({ page }) => {
  await page.goto("/signup");
  await hydrated(page);
  await page.fill("#account-email", "ada@acme.io");
  await page.fill("#account-password", "correct-horse");
  await page.fill("#account-confirm", "correct-horse");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/create-org$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your organization");
});
