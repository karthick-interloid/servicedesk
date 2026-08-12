import { expect, test, type Page } from "@playwright/test";

/**
 * `/views` renders from `MOCK_SAVED_VIEWS`, a local module — no Supabase, no query. That
 * is why these pass in an environment with no database, while `ticket-queue.spec.ts` (which
 * reads live rows) cannot. When the wiring slice swaps the mock for a real query, these
 * become dependent on seeded data in exactly the way the queue's already are.
 */

/**
 * `support/hydrated` keys on a `<form>`; this screen has none, and no tablist either. The
 * "New view" button is its always-present interactive root, and React tags every host node
 * it owns with a `__reactFiber$…` key at hydration time — the same precise signal.
 */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const button = document.querySelector("button");
    return Boolean(button) && Object.keys(button!).some((k) => k.startsWith("__reactFiber$"));
  });
}

const rows = (page: Page) => page.getByRole("button", { name: /^Edit / });

test.describe("saved views", () => {
  test("lists every mock view with its count and both row actions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/views");
    await hydrated(page);

    await expect(page.getByRole("heading", { level: 1, name: "Saved views" })).toBeVisible();
    await expect(
      page.getByText("Shared filters your team works from. Order sets the tab order on the queue."),
    ).toBeVisible();

    // Ten mock rows, so ten Edit buttons and ten Open links.
    await expect(rows(page)).toHaveCount(10);
    await expect(page.getByRole("link", { name: /^Open / })).toHaveCount(10);

    // The design's five, in its own order, with its own counts.
    for (const [name, count] of [
      ["All open", "19"],
      ["My tickets", "0"],
      ["Unassigned", "5"],
      ["Breaching", "4"],
      ["Solved", "5"],
    ] as const) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByText(`${count} tickets`, { exact: true }).first()).toBeVisible();
    }
  });

  test("renames a view in local state only", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/views");
    await hydrated(page);

    await page.getByRole("button", { name: "Edit Breaching" }).click();
    await expect(page.getByRole("heading", { name: "Edit view" })).toBeVisible();

    const field = page.getByLabel("View name");
    await expect(field).toHaveValue("Breaching");
    await field.fill("Breaching soon");
    await page.getByRole("button", { name: "Save view" }).click();

    await expect(page.getByText("Breaching soon", { exact: true })).toBeVisible();
    await expect(page.getByText("Breaching", { exact: true })).toBeHidden();

    // Presentational only: nothing persisted, so a reload restores the mock name.
    await page.reload();
    await hydrated(page);
    await expect(page.getByText("Breaching", { exact: true })).toBeVisible();
    await expect(page.getByText("Breaching soon", { exact: true })).toBeHidden();
  });

  test("appends a new view from the empty state", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/views?state=empty");
    await hydrated(page);

    await expect(page.getByRole("heading", { level: 2, name: "No saved views yet" })).toBeVisible();
    await expect(rows(page)).toHaveCount(0);

    await page.getByRole("button", { name: "New view" }).last().click();
    await expect(page.getByRole("heading", { name: "New view" })).toBeVisible();

    await page.getByLabel("View name").fill("Waiting on engineering");
    await page.getByRole("button", { name: "Save view" }).click();

    // The empty card gives way to a one-row list, still entirely in local state.
    await expect(page.getByText("Waiting on engineering", { exact: true })).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "No saved views yet" })).toBeHidden();
  });

  test("keeps the row readable at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/views");
    await hydrated(page);

    await expect(page.getByRole("heading", { level: 1, name: "Saved views" })).toBeVisible();
    await expect(rows(page)).toHaveCount(10);

    // The row wraps rather than overflowing — nothing scrolls sideways.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
