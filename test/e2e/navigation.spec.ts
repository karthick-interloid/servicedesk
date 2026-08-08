import { expect, test } from "@playwright/test";

test("home page renders the dashboard placeholder inside the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /dashboard — coming soon/i }),
  ).toBeVisible();
  // The shell wraps it: sidebar nav plus the sticky top bar.
  await expect(page.getByRole("link", { name: "Ticket queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: /notifications/i })).toBeVisible();
});

test("the about page is still reachable directly", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
