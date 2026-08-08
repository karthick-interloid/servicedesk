import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The reset-request screen. Nothing is sent — no server action, no mail provider, no
 * token. Submitting only moves this component's own state between the design's two
 * in-card states.
 */

const banner = (page: import("@playwright/test").Page) => page.locator('[data-slot="alert"]');

test("the request screen carries no app-shell chrome", async ({ page }) => {
  await page.goto("/forgot-password");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reset your password");
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
});

test("shape errors stay at field level with no banner", async ({ page }) => {
  await page.goto("/forgot-password");
  await hydrated(page);

  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator("#forgot-email-error")).toHaveText("Enter your work email");
  await expect(banner(page)).toHaveCount(0);

  await page.fill("#forgot-email", "nope");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator("#forgot-email-error")).toHaveText("Enter a valid email address");
  await expect(banner(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("a valid request shows the design's confirmation state", async ({ page }) => {
  await page.goto("/forgot-password");
  await hydrated(page);
  await page.fill("#forgot-email", "sam@northwind.io");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check your inbox");
  await expect(page.getByRole("button", { name: "Resend link" })).toBeVisible();
  // The form is replaced, not appended to.
  await expect(page.locator("#forgot-email")).toHaveCount(0);
  // "Back to sign in" sits outside both states in the design.
  await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("asking again trips the design's rate limit and returns to the form", async ({ page }) => {
  await page.goto("/forgot-password");
  await hydrated(page);
  await page.fill("#forgot-email", "sam@northwind.io");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page.getByRole("button", { name: "Resend link" }).click();

  // The design's own state logic shows the form again whenever an error is present.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reset your password");
  await expect(banner(page)).toContainText("We couldn't send that link.");
  await expect(page.locator("#forgot-email-error")).toHaveText("Rate limited");
  await expect(page.locator("#forgot-email")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("login links here and the screen links back", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);
  await page.getByRole("link", { name: "Forgot password?" }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  await hydrated(page);
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
