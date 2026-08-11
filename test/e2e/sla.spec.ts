import { expect, test, type Page } from "@playwright/test";

/**
 * `/settings/sla` and its editor render from `mock-sla.ts`, a local module — no Supabase —
 * so these pass without a database.
 *
 * ⚠ None of this can be wired to today's `sla_policies` as it stands: the design's policy
 * grain conflicts with `unique (tenant_id, priority_scope)`, which `register.service.ts`
 * already fills. See docs/SLA-DIFF.md.
 */

const ready = (page: Page) => page.waitForFunction(() => Boolean(document.querySelector("h1")));

const rows = (page: Page) => page.locator('a[href^="/settings/sla/"]:not([href$="/new"])');

test.describe("SLA policy list", () => {
  test("renders every policy with its scope, ticket count and status", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/settings/sla");
    await ready(page);

    await expect(page.getByRole("heading", { level: 1, name: "SLA policies" })).toBeVisible();
    await expect(page.getByText("Targets are measured against your business hours.")).toBeVisible();

    await expect(rows(page)).toHaveCount(3);
    await expect(rows(page).first()).toContainText("Priority support");
    await expect(rows(page).first()).toContainText("Business & Enterprise customers");
    await expect(rows(page).first()).toContainText("412 tickets");
    await expect(rows(page).first()).toContainText("Active");
    await expect(rows(page).nth(2)).toContainText("Paused");

    // Scoped to the card: the shell footer also has a "Status" link.
    const listCard = page.locator('[data-slot="card"]').first();
    for (const label of ["Policy", "Applied to", "Status"]) {
      await expect(listCard.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("hides the header row at 375 without overflowing", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/settings/sla");
    await ready(page);

    await expect(rows(page)).toHaveCount(3);
    await expect(page.getByText("Applied to", { exact: true })).toBeHidden();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("shows the design's empty card", async ({ page }) => {
    await page.goto("/settings/sla?state=empty");
    await ready(page);

    await expect(
      page.getByRole("heading", { level: 2, name: "No SLA policies yet" }),
    ).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Create first policy" })).toBeVisible();
  });
});

test.describe("list → editor navigation", () => {
  test("opens a policy and shows all four priority targets", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/settings/sla");
    await ready(page);

    await rows(page).filter({ hasText: "Priority support" }).click();
    await expect(page).toHaveURL("/settings/sla/priority-support");

    await expect(page.getByRole("heading", { level: 1, name: "Priority support" })).toBeVisible();
    await expect(page.locator("#sla-name")).toHaveValue("Priority support");

    // The four rows, with onboarding's own prose values.
    for (const [scope, first, resolution] of [
      ["urgent", "15 minutes", "4 hours"],
      ["high", "1 hour", "8 business hours"],
      ["normal", "4 business hours", "2 business days"],
      ["low", "1 business day", "5 business days"],
    ] as const) {
      await expect(page.locator(`#sla-${scope}-first`)).toHaveValue(first);
      await expect(page.locator(`#sla-${scope}-resolution`)).toHaveValue(resolution);
    }

    // Business hours + holidays come from the bound business_hours record.
    await expect(page.getByText("Independence Day — 15 Aug")).toBeVisible();

    await page.getByRole("link", { name: "SLA policies" }).first().click();
    await expect(page).toHaveURL("/settings/sla");
  });

  test("every list row resolves to an editor", async ({ page }) => {
    await page.goto("/settings/sla");
    await ready(page);

    const hrefs = await rows(page).evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!),
    );
    expect(hrefs).toEqual([
      "/settings/sla/priority-support",
      "/settings/sla/standard",
      "/settings/sla/weekend-escalation",
    ]);

    for (const href of hrefs) {
      await page.goto(href);
      await ready(page);
      await expect(page.locator("#sla-name")).not.toHaveValue("");
    }
  });

  test("New policy opens a blank editor titled for creation", async ({ page }) => {
    await page.goto("/settings/sla");
    await ready(page);

    await page.getByRole("link", { name: "New policy" }).click();
    await expect(page).toHaveURL("/settings/sla/new");

    await expect(page.getByRole("heading", { level: 1, name: "New SLA policy" })).toBeVisible();
    await expect(page.locator("#sla-name")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Create policy" })).toBeVisible();
  });

  test("falls through to the app's 404 on an unknown policy id", async ({ page }) => {
    await page.goto("/settings/sla/no-such-policy");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  });
});

test.describe("editor validation", () => {
  test("blocks save on a missing name and reports it", async ({ page }) => {
    await page.goto("/settings/sla/priority-support");
    await ready(page);

    await page.fill("#sla-name", "");
    await page.getByRole("button", { name: "Save policy" }).click();

    await expect(page.getByText("Give this policy a name.")).toBeVisible();
    // Still on the editor — save is refused, not merely warned about.
    await expect(page).toHaveURL("/settings/sla/priority-support");
  });

  test("rejects a duration it cannot parse", async ({ page }) => {
    await page.goto("/settings/sla/priority-support");
    await ready(page);

    await page.fill("#sla-urgent-first", "soon");
    await page.getByRole("button", { name: "Save policy" }).click();

    await expect(page.getByText(/Use a number and a unit/)).toBeVisible();
    await expect(page).toHaveURL("/settings/sla/priority-support");
  });

  test("rejects a resolution shorter than its first response", async ({ page }) => {
    await page.goto("/settings/sla/priority-support");
    await ready(page);

    // 5 minutes against a 1-hour first response.
    await page.fill("#sla-high-resolution", "5 minutes");
    await page.getByRole("button", { name: "Save policy" }).click();

    await expect(
      page.getByText("Resolution must be at least the first-response target."),
    ).toBeVisible();
    await expect(page).toHaveURL("/settings/sla/priority-support");
  });

  test("accepts a valid edit and returns to the list without persisting", async ({ page }) => {
    await page.goto("/settings/sla/priority-support");
    await ready(page);

    await page.fill("#sla-name", "Priority support — revised");
    await page.fill("#sla-urgent-first", "20 minutes");
    await page.getByRole("button", { name: "Save policy" }).click();

    await expect(page).toHaveURL("/settings/sla");

    // Presentational only: the list still shows the original name.
    await expect(rows(page).first()).toContainText("Priority support");
    await expect(page.getByText("Priority support — revised")).toBeHidden();
  });

  test("business-hours select swaps the calendar and holidays", async ({ page }) => {
    await page.goto("/settings/sla/priority-support");
    await ready(page);

    await expect(page.getByText("Diwali — 20 Oct")).toBeVisible();

    await page.locator("#sla-hours").click();
    await page.getByRole("option", { name: "24 / 7" }).click();

    // The 24/7 record has no holidays and every day working.
    await expect(page.getByText("No holidays on this calendar.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sun", exact: true })).toHaveAttribute(
      "data-state",
      "on",
    );
  });
});
