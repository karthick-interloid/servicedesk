import { expect, test } from "@playwright/test";

import { hydrated } from "./support/hydrated";

/**
 * The login screen is wired to `loginAction` → Supabase. These lock in the parts that hold
 * regardless of whether Supabase is configured in the environment running the suite: shape
 * errors never reach the server, a server failure lands in the banner, and neither path
 * navigates away.
 *
 * Deliberately no happy-path test — that needs a seeded user and real project keys, so it
 * belongs in an integration suite with a known fixture rather than here.
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

  // Both fields start empty — the design's seeded `sam@northwind.io` was dropped when the
  // form went live, so a bare submit now reports both required messages.
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter your work email")).toBeVisible();
  await expect(page.getByText("Enter your password")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);

  await page.fill("#login-email", "not-an-email");
  await page.fill("#login-password", "abc");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  // Still client-side: the resolver rejected it, so no action ran and no banner appeared.
  await expect(banner(page)).toHaveCount(0);

  await expect(page).toHaveURL(/\/login$/);
});

test("a well-formed submission reaches the server and reports failure in the banner", async ({
  page,
}) => {
  await page.goto("/login");
  await hydrated(page);

  await page.fill("#login-email", "nobody@northwind.io");
  await page.fill("#login-password", "hunter2hunter2");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Which copy appears depends on the environment — "That email and password don't match."
  // against a live project, "We couldn't sign you in." when Supabase keys are absent. Both
  // are real server outcomes, so assert the banner exists rather than pinning the wording.
  await expect(banner(page)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
