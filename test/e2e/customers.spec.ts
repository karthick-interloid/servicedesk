import { expect, test, type Page } from "@playwright/test";

/**
 * `/customers` and `/customers/[id]` render from `mock-companies.ts` + `mock-tickets.ts`,
 * both local modules — no Supabase — so these pass without a database, unlike
 * `ticket-queue.spec.ts`.
 *
 * The reconciliation itself (every ticket resolving to exactly one company) is asserted in
 * jsdom by `test/features/customers/company-tickets.test.ts`; what these cover is that the
 * rendered pages agree with it, and that the List→Record walk works on stable ids.
 */

const ready = (page: Page) => page.waitForFunction(() => Boolean(document.querySelector("h1")));

const rows = (page: Page) => page.locator('a[href^="/customers/"]');

test.describe("customers list", () => {
  test("renders all five columns at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/customers");
    await ready(page);

    await expect(page.getByRole("heading", { level: 1, name: "Customers" })).toBeVisible();
    await expect(rows(page)).toHaveCount(9);

    for (const label of ["Company", "Plan", "Open", "CSAT", "Account owner"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    // The design's six, in its order, ahead of the three this build adds.
    const names = await rows(page).locator("span > span > span").first().allTextContents();
    expect(names.length).toBeGreaterThan(0);
    await expect(rows(page).first()).toContainText("Meridian Labs");
    await expect(rows(page).first()).toContainText("meridianlabs.com");
    await expect(rows(page).first()).toContainText("Enterprise");
  });

  test("drops to company and plan only at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/customers");
    await ready(page);

    await expect(rows(page)).toHaveCount(9);
    // The header row and the three data cells are hidden below md, never disabled.
    await expect(page.getByText("Account owner", { exact: true })).toBeHidden();
    await expect(rows(page).first()).toContainText("Enterprise");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("shows the design's empty card when there are no companies", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/customers?state=empty");
    await ready(page);

    await expect(page.getByRole("heading", { level: 2, name: "No companies yet" })).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
  });
});

test.describe("list → record navigation", () => {
  test("walks from the list row to that company's record and back", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/customers");
    await ready(page);

    // Click the row itself — the whole row is the link, as the design's row is clickable.
    await rows(page).filter({ hasText: "Fernwood Group" }).click();

    await expect(page).toHaveURL("/customers/fernwood-group");
    await expect(page.getByRole("heading", { level: 1, name: "Fernwood Group" })).toBeVisible();
    await expect(page.getByText("fernwood.group · Customer since Sep 2024")).toBeVisible();

    // Both Fernwood contacts, from the shared requester records.
    await expect(page.getByText("Grace Okonjo")).toBeVisible();
    await expect(page.getByText("Chloe Barrett")).toBeVisible();

    // And both of their tickets — the coherence the reconciliation buys.
    await expect(page.getByText("Refund not reflected on statement")).toBeVisible();
    await expect(
      page.getByText("Password reset email never arrives", { exact: false }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Customers" }).first().click();
    await expect(page).toHaveURL("/customers");
  });

  test("every list row resolves to a record that names the same company", async ({ page }) => {
    await page.goto("/customers");
    await ready(page);

    const hrefs = await rows(page).evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!),
    );
    expect(hrefs).toHaveLength(9);

    for (const href of hrefs) {
      await page.goto(href);
      await ready(page);
      // A stable id that did not resolve would have 404'd instead.
      await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Customers");
      await expect(page.getByText("Open tickets", { exact: true })).toBeVisible();
    }
  });

  test("falls through to the app's 404 on an unknown company id", async ({ page }) => {
    await page.goto("/customers/no-such-company");

    /* Asserted on the rendered page rather than the HTTP status: `next dev` serves the
       not-found body with a 200 while `next start` sends a real 404, and this suite runs
       against dev locally and against the production build on CI. The design draws no
       per-screen not-found treatment, so this IS the designed outcome — the app's own
       not-found.tsx. */
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Page not found" })).toBeVisible();
  });
});

test.describe("customer record", () => {
  test("agrees with the ticket mock: open count matches the rows listed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/customers/meridian-labs");
    await ready(page);

    await expect(page.getByRole("heading", { level: 1, name: "Meridian Labs" })).toBeVisible();

    // Contacts — exactly what the design draws for this company.
    await expect(page.getByText("dana@meridianlabs.com")).toBeVisible();
    await expect(page.getByText("Primary contact")).toBeVisible();
    await expect(page.getByText("owen@meridianlabs.com")).toBeVisible();
    await expect(page.getByText("Billing", { exact: true })).toBeVisible();

    // Dana's one open ticket, and the derived count that must agree with it.
    const ticketRows = page.locator('a[href^="/tickets/"]');
    await expect(ticketRows).toHaveCount(1);
    await expect(ticketRows.first()).toContainText("#4821");
    await expect(ticketRows.first()).toContainText("Duplicate charge on invoice INV-2291");
    await expect(ticketRows.first()).toContainText("Open");
  });

  test("stacks the stat cards and the two columns at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/customers/halcyon-bank");
    await ready(page);

    await expect(page.getByRole("heading", { level: 1, name: "Halcyon Bank" })).toBeVisible();
    // Two contacts, two tickets — the widest Fernwood/Halcyon case.
    await expect(page.locator('a[href^="/tickets/"]')).toHaveCount(2);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
