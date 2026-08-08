import { describe, expect, it } from "vitest";
import { NAV_GROUPS, findActiveNavItem } from "@/features/shell/lib/nav";

describe("shell nav config", () => {
  it("carries the design's groups, order and hrefs", () => {
    expect(NAV_GROUPS.map((g) => g.title)).toEqual([null, "Settings", "Account"]);
    expect(NAV_GROUPS[0]?.items.map((i) => i.label)).toEqual([
      "Ticket queue",
      "Saved views",
      "Customers",
      "Knowledge base",
      "Macros & templates",
      "SLA policies",
      "Reports",
    ]);
    expect(NAV_GROUPS[1]?.items.map((i) => i.label)).toEqual([
      "Team & roles",
      "Branding",
      "Channels & email",
      "Integrations & API",
      "Security & SSO",
      "Data & privacy",
      "Notification center",
      "Audit log",
    ]);
    expect(NAV_GROUPS[2]?.items.map((i) => i.label)).toEqual([
      "Billing overview",
      "Plans & pricing",
    ]);
  });

  it("has a unique href per item", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("findActiveNavItem", () => {
  it("matches an exact route", () => {
    expect(findActiveNavItem("/tickets")?.item.label).toBe("Ticket queue");
  });

  it("matches a child route", () => {
    expect(findActiveNavItem("/tickets/4819")?.item.label).toBe("Ticket queue");
  });

  it("prefers the longest matching href over a shorter prefix", () => {
    // Both "/billing" and "/billing/plans" match; the more specific one must win.
    expect(findActiveNavItem("/billing/plans")?.item.label).toBe("Plans & pricing");
  });

  it("reports the owning group so the header can build a breadcrumb", () => {
    expect(findActiveNavItem("/settings/team")?.group.title).toBe("Settings");
    expect(findActiveNavItem("/tickets")?.group.title).toBeNull();
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(findActiveNavItem("/ticketsomething")).toBeNull();
  });

  it("returns null for a route outside the nav", () => {
    expect(findActiveNavItem("/")).toBeNull();
  });
});
