import { expect, test, type Page } from "@playwright/test";

/**
 * Regression cover for the lg-boundary resize bug: `SidebarProvider` keeps `openMobile`
 * in its own state and never resets it when `isMobile` flips, so a drawer left open at
 * mobile width used to spring back open on the return crossing and its modal scrim
 * swallowed every click in the header. See src/features/shell/components/
 * sidebar-viewport-sync.tsx for the full trace.
 */

const MOBILE = { width: 375, height: 900 };
const DESKTOP = { width: 1440, height: 900 };

/**
 * `useIsMobile()` reports false until its effect runs, so the server and the first client
 * render both emit the permanent sidebar. Waiting on that container appearing/disappearing
 * is therefore a precise "hydrated and settled at this width" signal — without it the test
 * can click a button that React has not wired up yet.
 */
async function settled(page: Page, at: "mobile" | "desktop") {
  await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(at === "mobile" ? 0 : 1);
}

/** Exactly one toggle may be *visible* at a time; the other variant is CSS-hidden. */
async function expectOneVisibleTrigger(page: Page) {
  await expect(page.locator('[data-sidebar="trigger"]:visible')).toHaveCount(1);
}

/**
 * A real mouse click, so scrims and pointer-events actually take part in hit testing.
 * The control swaps element type across the boundary — a typeable <input> at lg and up,
 * an icon <button> below it — so match on the label rather than on the tag.
 */
async function expectSearchClickable(page: Page) {
  const search = page.locator('header [aria-label="Search"]:visible');
  await expect(search).toHaveCount(1);
  await search.click({ trial: true, timeout: 2000 });
  await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
}

test("the shell survives repeated lg-boundary crossings", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await settled(page, "desktop");
  await expectOneVisibleTrigger(page);
  await expectSearchClickable(page);

  for (let pass = 0; pass < 3; pass += 1) {
    await page.setViewportSize(MOBILE);
    await settled(page, "mobile");
    await expectOneVisibleTrigger(page);
    await expectSearchClickable(page);

    await page.setViewportSize(DESKTOP);
    await settled(page, "desktop");
    await expectOneVisibleTrigger(page);
    await expectSearchClickable(page);
  }
});

test("a drawer left open at mobile width does not reopen on the return crossing", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/");
  await settled(page, "mobile");

  await page.getByRole("button", { name: /toggle sidebar/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Cross out of mobile with the drawer still open, then come back.
  await page.setViewportSize(DESKTOP);
  await settled(page, "desktop");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectSearchClickable(page);

  await page.setViewportSize(MOBILE);
  await settled(page, "mobile");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectOneVisibleTrigger(page);
  await expectSearchClickable(page);
});
