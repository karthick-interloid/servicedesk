/**
 * ███  M O C K   D A T A  —  R E P L A C E   A T   W I R I N G  ███
 *
 * Nothing here touches the network. See `../types.ts` for why this cannot simply be swapped
 * for a query: the design's policy grain is incompatible with `unique (tenant_id,
 * priority_scope)`, and four edited fields have no column.
 *
 * ─── HOW THIS CONNECTS TO WHAT ALREADY EXISTS ────────────────────────────────
 * The four priority targets are built from onboarding's exported `SLA_TARGETS`, not retyped:
 * the same `scope` enum value, the same display `label`, the same `tone`, and the same prose
 * strings ("15 minutes", "8 business hours"). So the pill treatment on this screen is the
 * one onboarding step 2 and the queue already use — `<Badge tone={...} dot>` — and there is
 * no third priority representation anywhere in the app.
 *
 * `lib/duration.ts` converts that prose to minutes using onboarding's own exported
 * `BUSINESS_DAY_MINS`, so the numbers this editor would save match the ones
 * `register.service.ts` already writes for the same strings.
 *
 * The business-hours record mirrors what `register.service.ts` seeds at signup (Mon–Fri,
 * 09:00–18:30, IST) and what onboarding step 1 collects, so the editor's calendar section
 * shows the same working week the tenant was created with.
 *
 * Coverage: the default policy plus two non-default ones; all four priorities appear in
 * every policy's target list, so both the list summary and the editor's four rows render
 * fully. Statuses cover Active ×2 and Paused ×1 (Draft is reachable via the editor select).
 */

import { SLA_TARGETS } from "@/features/onboarding/lib/onboarding-data";

import type { BusinessHours, SlaPolicy, SlaTargetRow } from "../types";

/** The tenant's business-hours record. Real source: `public.business_hours`. */
export const MOCK_BUSINESS_HOURS: BusinessHours[] = [
  {
    id: "bh-northwind-standard",
    name: "Northwind standard",
    timezoneLabel: "IST",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    dayStart: "09:00",
    dayEnd: "18:30",
    // `business_hours.holidays_json`, verbatim from the design's `holidays` const.
    holidays: ["Independence Day — 15 Aug", "Diwali — 20 Oct", "Christmas — 25 Dec"],
  },
  {
    id: "bh-24-7",
    name: "24 / 7",
    timezoneLabel: "UTC",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayStart: "00:00",
    dayEnd: "23:59",
    holidays: [],
  },
  {
    id: "bh-follow-the-sun",
    name: "Follow-the-sun",
    timezoneLabel: "IST + GMT + EST",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    dayStart: "00:00",
    dayEnd: "23:59",
    holidays: ["Christmas — 25 Dec"],
  },
];

/** The design's select renders "Northwind standard (Mon–Fri, 09:00–18:30 IST)". */
export function businessHoursLabel(hours: BusinessHours): string {
  if (hours.days.length === 7 && hours.dayStart === "00:00") {
    return hours.name;
  }

  const span =
    hours.days.length > 1 ? `${hours.days[0]}–${hours.days[hours.days.length - 1]}` : hours.days[0];

  return `${hours.name} (${span}, ${hours.dayStart}–${hours.dayEnd} ${hours.timezoneLabel})`;
}

export function findBusinessHours(id: string): BusinessHours | undefined {
  return MOCK_BUSINESS_HOURS.find((h) => h.id === id);
}

/**
 * The four target rows, derived from onboarding's `SLA_TARGETS`.
 *
 * `overrides` lets a policy differ on one or two priorities without re-declaring all four —
 * which is what keeps every policy covering all four priorities, as the design's editor
 * always shows four rows.
 */
function targets(overrides: Partial<Record<string, Partial<SlaTargetRow>>> = {}): SlaTargetRow[] {
  return SLA_TARGETS.map((t) => ({
    scope: t.scope,
    label: t.priority,
    tone: t.tone,
    firstResponse: t.firstReply,
    resolution: t.resolve,
    ...overrides[t.scope],
  }));
}

export const MOCK_SLA_POLICIES: SlaPolicy[] = [
  {
    id: "priority-support",
    name: "Priority support",
    status: "Active",
    appliesTo: "Business & Enterprise customers",
    businessHoursId: "bh-northwind-standard",
    // The design's own editor values for this policy — identical to SLA_TARGETS.
    targets: targets(),
    notifyBeforeBreach: true,
    escalateOnBreach: true,
    appliedTicketCount: 412,
    createdAt: "2024-03-04T09:00:00.000Z",
  },
  {
    id: "standard",
    name: "Standard",
    status: "Active",
    appliesTo: "All customers",
    businessHoursId: "bh-northwind-standard",
    // Slower across the board — a non-default policy that is genuinely different.
    targets: targets({
      urgent: { firstResponse: "30 minutes", resolution: "8 hours" },
      high: { firstResponse: "2 hours", resolution: "1 business day" },
      normal: { firstResponse: "1 business day", resolution: "3 business days" },
      low: { firstResponse: "2 business days", resolution: "10 business days" },
    }),
    notifyBeforeBreach: true,
    escalateOnBreach: false,
    appliedTicketCount: 1088,
    createdAt: "2024-03-04T09:05:00.000Z",
  },
  {
    id: "weekend-escalation",
    name: "Weekend escalation",
    status: "Paused",
    appliesTo: "Urgent tickets only",
    businessHoursId: "bh-24-7",
    targets: targets({
      urgent: { firstResponse: "10 minutes", resolution: "2 hours" },
      high: { firstResponse: "45 minutes", resolution: "6 hours" },
    }),
    notifyBeforeBreach: true,
    escalateOnBreach: true,
    appliedTicketCount: 36,
    createdAt: "2025-01-18T09:00:00.000Z",
  },
];

/** Stable-id lookup for `/settings/sla/[id]`. Undefined for an unknown segment. */
export function findSlaPolicy(id: string): SlaPolicy | undefined {
  return MOCK_SLA_POLICIES.find((p) => p.id === id);
}

/** A blank policy for `/settings/sla/new`, pre-filled with the onboarding defaults. */
export function blankSlaPolicy(): SlaPolicy {
  return {
    id: "",
    name: "",
    status: "Draft",
    appliesTo: "All customers",
    businessHoursId: MOCK_BUSINESS_HOURS[0]!.id,
    targets: targets(),
    notifyBeforeBreach: true,
    escalateOnBreach: false,
    appliedTicketCount: 0,
    createdAt: new Date(0).toISOString(),
  };
}
