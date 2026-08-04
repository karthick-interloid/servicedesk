import { expect, test } from "@playwright/test";

test("home page shows the hero heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /ship production-ready apps/i }),
  ).toBeVisible();
});

test("can navigate from home to the about page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /learn more/i }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
