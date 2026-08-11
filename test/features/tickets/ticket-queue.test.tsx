import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The queue now contains the New ticket sheet, which calls `useRouter()` to refresh the
 * list after a create. jsdom has no app router mounted, so the hook throws "invariant
 * expected app router to be mounted" and takes every render below with it. Stubbing the
 * two methods that component actually uses keeps these tests about the queue.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/tickets",
  useSearchParams: () => new URLSearchParams(),
}));

import { TicketQueue } from "@/features/tickets/components/ticket-queue";
import { CURRENT_USER_ID, MOCK_TICKETS, QUEUE_NOW } from "@/features/tickets/lib/mock-tickets";

/**
 * The route these mount under is currently unreachable — `src/app/(app)/layout.tsx` does
 * not compile while the auth slice is mid-refactor (see docs/QUEUE-DIFF.md §Blocked).
 * Rendering the component directly verifies everything about the queue that does not
 * depend on the shell: column set, responsive gates, tone mapping and the four states.
 */

/**
 * The queue takes its rows as props now that it is wired to Supabase, so these render it
 * over the fixture that used to be its data source. `mock-tickets.ts` survives for exactly
 * this: a hand-checked set covering every status, priority and SLA state, against a frozen
 * clock, which is what makes the assertions below stable.
 */
function renderQueue(props: Partial<React.ComponentProps<typeof TicketQueue>> = {}) {
  return render(
    <TicketQueue
      tickets={MOCK_TICKETS}
      currentUserId={CURRENT_USER_ID}
      customers={[]}
      now={QUEUE_NOW}
      {...props}
    />,
  );
}

const table = () => document.querySelector("table")!;
const headerCells = () => [...table().querySelectorAll("thead th")];
const bodyRows = () => [...table().querySelectorAll("tbody tr")];

describe("TicketQueue — default state", () => {
  it("renders the design's eight tracks in order", () => {
    renderQueue();
    expect(headerCells().map((th) => th.textContent?.trim())).toEqual([
      "",
      "Ticket",
      "Subject",
      "Requester",
      "Priority",
      "Assignee",
      "Status",
      "SLA",
    ]);
  });

  it("paginates to eight rows and reports the count", () => {
    renderQueue();
    expect(bodyRows()).toHaveLength(8);
    expect(screen.getByText(/Showing 1–8 of 13/)).toBeTruthy();
  });

  it("summarises breached and at-risk counts in the subtitle", () => {
    renderQueue();
    expect(screen.getByText(/13 in this view · 4 breached, 4 at risk/)).toBeTruthy();
  });

  it("shows the newest ticket first, matching the design capture", () => {
    renderQueue();
    expect(bodyRows()[0]!.textContent).toContain("#4823");
    expect(bodyRows()[0]!.textContent).toContain("Chat widget stuck on 'Connecting…'");
  });

  it("names an unassigned row rather than leaving the cell blank", () => {
    renderQueue();
    const row = bodyRows().find((r) => r.textContent?.includes("#4822"))!;
    expect(within(row as HTMLElement).getByText("Unassigned")).toBeTruthy();
  });

  /* Truncation rides on `table-fixed`: every other track carries an explicit width, so
     the subject cell is the only one without one and absorbs the remainder instead of
     letting its text set the column width — which is how the design overflows at 1024. */
  it("truncates the subject rather than widening the table", () => {
    renderQueue();
    const link = screen.getAllByRole("link", { name: /Chat widget stuck/ })[0]!;
    expect(link.className).toContain("truncate");
    expect(table().className).toContain("table-fixed");

    const subjectHead = headerCells().find((th) => th.textContent?.trim() === "Subject")!;
    expect(subjectHead.className).not.toMatch(/\bw-/);
    for (const name of ["Ticket", "Priority", "SLA"]) {
      expect(headerCells().find((th) => th.textContent?.trim() === name)!.className).toMatch(
        /\bw-\[/,
      );
    }
  });

  /* The 44px pitch the capture measures only comes out right if the 1px rule collapses
     into the row box, the way the design's CSS grid draws it. */
  it("collapses row borders so the 44px pitch holds", () => {
    renderQueue();
    expect(table().className).toContain("border-collapse");
    expect(bodyRows()[0]!.className).toContain("h-11");
  });
});

describe("TicketQueue — badge tones", () => {
  it("paints `New` with the brand tone (treatments.md T8)", () => {
    renderQueue();
    const row = bodyRows().find((r) => r.textContent?.includes("#4823"))!;
    const badge = within(row as HTMLElement)
      .getByText("New")
      .closest("[data-slot=badge]")!;
    expect(badge.getAttribute("data-tone")).toBe("brand");
  });

  it("gives status and SLA a dot, and priority none — the design's dot rule", () => {
    renderQueue();
    const row = bodyRows().find((r) => r.textContent?.includes("#4823"))!;
    const badgeFor = (label: string | RegExp) =>
      within(row as HTMLElement)
        .getByText(label)
        .closest("[data-slot=badge]")!;

    expect(badgeFor("New").querySelector("span[aria-hidden=true]")).not.toBeNull();
    expect(badgeFor(/22m left/).querySelector("span[aria-hidden=true]")).not.toBeNull();
    expect(badgeFor("Urgent").querySelector("span[aria-hidden=true]")).toBeNull();
  });

  it("maps every visible priority and SLA state to its design tone", () => {
    renderQueue();
    const toneOf = (label: string | RegExp) =>
      screen.getAllByText(label)[0]!.closest("[data-slot=badge]")!.getAttribute("data-tone");

    expect(toneOf("Urgent")).toBe("error");
    expect(toneOf("High")).toBe("warning");
    expect(toneOf("Normal")).toBe("info");
    expect(toneOf("Low")).toBe("neutral");
    expect(toneOf(/Breached 26m/)).toBe("error");
    expect(toneOf(/22m left/)).toBe("warning");
    expect(toneOf(/3d 4h left/)).toBe("success");
  });
});

describe("TicketQueue — responsive gates", () => {
  /* The 1024–1279 fix. Requester and status must be xl-gated so that band drops to six
     tracks; assignee stays lg-gated. Asserted on the class, because jsdom has no layout. */
  it("gates requester and status at xl, and assignee at lg", () => {
    renderQueue();
    const head = (name: string) => headerCells().find((th) => th.textContent?.trim() === name)!;

    expect(head("Requester").className).toContain("xl:table-cell");
    expect(head("Status").className).toContain("xl:table-cell");
    expect(head("Assignee").className).toContain("lg:table-cell");
    expect(head("Assignee").className).not.toContain("xl:table-cell");
  });

  it("keeps the always-on tracks ungated", () => {
    renderQueue();
    for (const name of ["Ticket", "Subject", "Priority", "SLA"]) {
      expect(headerCells().find((th) => th.textContent?.trim() === name)!.className).not.toContain(
        "hidden",
      );
    }
  });

  it("renders the mobile card list alongside the md-and-up table", () => {
    renderQueue();
    expect(document.querySelector("ul.md\\:hidden")).not.toBeNull();
    expect(table().closest("[data-slot=card]")!.className).toContain("md:block");
  });
});

describe("TicketQueue — the other three states", () => {
  it("renders the empty state and no table", () => {
    renderQueue({ state: "empty" });
    expect(screen.getByRole("heading", { name: "Queue clear" })).toBeTruthy();
    expect(document.querySelector("table")).toBeNull();
  });

  it("renders skeleton rows while loading", () => {
    renderQueue({ state: "loading" });
    expect(document.querySelectorAll("[data-slot=skeleton]").length).toBeGreaterThan(0);
    expect(document.querySelector("[aria-busy=true]")).not.toBeNull();
    expect(document.querySelector("table")).toBeNull();
  });

  it("renders the error state with a retry affordance", () => {
    renderQueue({ state: "error" });
    expect(screen.getByRole("heading", { name: /couldn't load your queue/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    expect(document.querySelector("table")).toBeNull();
  });

  it("keeps the toolbar reachable in every state", () => {
    for (const state of ["empty", "loading", "error"] as const) {
      const { unmount } = renderQueue({ state });
      /* Named by its visible eyebrow label, not its placeholder — the design draws both,
         and a placeholder alone is not an accessible name. */
      expect(screen.getByLabelText("Search")).toHaveAttribute("placeholder", "Search this view");
      expect(screen.getByLabelText("Priority")).toBeTruthy();
      expect(screen.getByLabelText("Status")).toBeTruthy();
      unmount();
    }
  });
});
