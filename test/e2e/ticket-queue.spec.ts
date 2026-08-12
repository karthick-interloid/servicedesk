import { expect, test, type Page } from "@playwright/test";

/**
 * ⚠ THESE CANNOT PASS YET, and not because of the queue. `src/app/(app)/layout.tsx` does
 * not compile while the auth slice is mid-refactor — `identity.ts` dropped its `ORG`/`USER`
 * exports and now pulls `next/headers` into two client components — so every route under
 * `(app)` returns 500. `test/e2e/navigation.spec.ts` is red for the same reason.
 * See docs/QUEUE-DIFF.md §Blocked. They should go green with no edit once the shell builds.
 *
 * The queue's own behaviour is covered today in jsdom by
 * `test/features/tickets/ticket-queue.test.tsx`, which needs no shell.
 */

/**
 * `support/hydrated` keys on a `<form>`; the queue has none. The saved-view tablist is
 * the queue's equivalent always-present interactive root, and React tags every host node
 * it owns with a `__reactFiber$…` key at hydration time — the same precise signal.
 */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const list = document.querySelector('[role="tablist"]');
    return Boolean(list) && Object.keys(list!).some((key) => key.startsWith("__reactFiber$"));
  });
}

const headers = (page: Page) => page.locator("table thead th");
const rows = (page: Page) => page.locator("table tbody tr");

test.describe("ticket queue", () => {
  test("renders all eight tracks at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tickets");
    await hydrated(page);

    await expect(page.getByRole("heading", { level: 1, name: "Tickets" })).toBeVisible();
    await expect(rows(page)).toHaveCount(8);
    for (const label of [
      "Ticket",
      "Subject",
      "Requester",
      "Priority",
      "Assignee",
      "Status",
      "SLA",
    ]) {
      await expect(headers(page).filter({ hasText: label }).first()).toBeVisible();
    }
  });

  /* The band the design capture breaks in. Six tracks, and — the part that actually
     matters — the subject track must still have width and still hold text. */
  test("drops requester and status at 1024, keeping the subject readable", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1000 });
    await page.goto("/tickets");
    await hydrated(page);

    await expect(headers(page).filter({ hasText: "Requester" })).toBeHidden();
    await expect(headers(page).filter({ hasText: "Status" })).toBeHidden();
    await expect(headers(page).filter({ hasText: "Assignee" }).first()).toBeVisible();

    const subject = rows(page).first().getByRole("link").first();
    await expect(subject).toBeVisible();
    await expect(subject).toHaveText(/\S/);
    expect((await subject.boundingBox())!.width).toBeGreaterThan(120);

    // Nothing may spill sideways out of the content column.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("falls back to four tracks at 768 and to cards at 375", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.goto("/tickets");
    await hydrated(page);
    await expect(headers(page).filter({ hasText: "Assignee" })).toBeHidden();
    await expect(page.locator("table")).toBeVisible();

    await page.setViewportSize({ width: 375, height: 1000 });
    await expect(page.locator("table")).toBeHidden();
    await expect(page.locator("ul > li [data-slot=card]")).toHaveCount(8);
  });

  test("serves the empty, loading and error states", async ({ page }) => {
    await page.goto("/tickets?state=empty");
    await hydrated(page);
    await expect(page.getByRole("heading", { name: "Queue clear" })).toBeVisible();

    await page.goto("/tickets?state=loading");
    await hydrated(page);
    await expect(page.locator("[aria-busy=true]")).toBeVisible();

    await page.goto("/tickets?state=error");
    await hydrated(page);
    await expect(page.getByRole("heading", { name: /couldn't load your queue/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });

  test("filters down to the empty state without a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tickets");
    await hydrated(page);

    await page.getByLabel("Search").fill("no subject contains this string");
    await expect(page.getByRole("heading", { name: "Queue clear" })).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);
  });
});
