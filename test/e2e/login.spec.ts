import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * Visual + client-validation build only — there is no auth. These lock in the two
 * guarantees that are easy to regress: the form never navigates, and the error banner is
 * reserved for a credential failure rather than a shape error.
 */

/**
 * Scoped to the alert slot on purpose: Next renders its own route announcer as
 * `<div role="alert" id="__next-route-announcer__">`, so a bare role query is ambiguous.
 */
const banner = (page: import("@playwright/test").Page) => page.locator('[data-slot="alert"]');

test("the login screen carries no app-shell chrome", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sign in to/i);
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(0);
});

test("shape errors stay at field level and never navigate", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter your password")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);

  await page.fill("#login-email", "not-an-email");
  await page.fill("#login-password", "abc");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);

  // The form intercepts submit — a native submit would have navigated by now.
  await expect(page).toHaveURL(/\/login$/);
});

test("a well-formed submission reaches the design's error state", async ({ page }) => {
  await page.goto("/login");
  await hydrated(page);

  await page.fill("#login-password", "hunter2hunter2");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(banner(page)).toContainText("That email and password don't match.");
  await expect(page.getByText("Incorrect password")).toBeVisible();
  // Field-level error lands on the password only; the email keeps its normal state.
  await expect(page.locator("#login-password")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#login-email")).not.toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/login$/);
});
