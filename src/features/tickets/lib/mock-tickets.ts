/**
 * ███  M O C K   D A T A  —  R E P L A C E   A T   W I R I N G  ███
 *
 * Nothing in this file touches the network. The rows below are hand-written to the exact
 * shape of `QueueTicket` (src/features/tickets/types.ts), which mirrors the tenant-scoped
 * tickets query documented there — so the wiring slice deletes this module, swaps
 * `MOCK_TICKETS` for the query result and `QUEUE_NOW` for `Date.now()`, and the queue
 * component is untouched.
 *
 * Two things here are deliberately fake beyond the values:
 *   · `requester.company` has NO column behind it — see the note on `QueueRequester`.
 *   · `QUEUE_NOW` freezes the clock so the SLA countdowns and "n min ago" stamps render
 *     identically on the server and the client, and so screenshots are reproducible.
 *
 * Coverage, so every badge tone and layout branch renders from page one to page two:
 *   status    — new ×3 · open ×5 · pending ×3 · on_hold ×2 · resolved ×1 · closed ×1
 *   priority  — urgent ×4 · high ×5 · normal ×4 · low ×2
 *   sla       — at_risk ×4 · breached ×4 · on_track ×5 · met ×2
 *   unassigned ×3 · subjects long enough to truncate ×3
 */

import type { QueueTicket } from "../types";

/** The frozen "now". Every relative string in the queue is measured from here. */
export const QUEUE_NOW = Date.parse("2026-08-10T14:00:00.000Z");

/** The signed-in agent, for the "My tickets" view. Real source: the session user. */
export const CURRENT_USER_ID = "u-sam-okafor";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const at = (offsetMs: number) => new Date(QUEUE_NOW + offsetMs).toISOString();

/**
 * EXPORTED so the customers feature can build its companies out of these exact people
 * rather than re-typing them. `mock-companies.ts` lists each company's contacts as
 * references INTO this object, so a person's `id` cannot drift out of sync with the
 * tickets that point at it — the company→ticket join is by `requester.id`, not by name.
 * See docs/CUSTOMERS-DIFF.md § "How the two mocks connect".
 */
export const REQUESTERS = {
  aisha: { id: "c-aisha-noor", fullName: "Aisha Noor", company: "Halcyon Bank" },
  ellie: { id: "c-ellie-novak", fullName: "Ellie Novak", company: "Kestrel Media" },
  dana: { id: "c-dana-whitfield", fullName: "Dana Whitfield", company: "Meridian Labs" },
  marcus: { id: "c-marcus-feld", fullName: "Marcus Feld", company: "Corely" },
  tom: { id: "c-tom-ashby", fullName: "Tom Ashby", company: "Halcyon Bank" },
  tomas: { id: "c-tomas-rivera", fullName: "Tomás Rivera", company: "Skyline Freight" },
  grace: { id: "c-grace-okonjo", fullName: "Grace Okonjo", company: "Fernwood Group" },
  lena: { id: "c-lena-brandt", fullName: "Lena Brandt", company: "Northgate Retail" },
  ravi: { id: "c-ravi-menon", fullName: "Ravi Menon", company: "Blume Studio" },
  ian: { id: "c-ian-mcallister", fullName: "Ian McAllister", company: "Rosewood Health" },
  chloe: { id: "c-chloe-barrett", fullName: "Chloe Barrett", company: "Fernwood Group" },
} as const;

const AGENTS = {
  sam: { id: CURRENT_USER_ID, fullName: "Sam Okafor", avatarUrl: null },
  priya: { id: "u-priya-raman", fullName: "Priya Raman", avatarUrl: null },
  ava: { id: "u-ava-lindqvist", fullName: "Ava Lindqvist", avatarUrl: null },
} as const;

const SLA_POLICY = {
  urgent: "sla-urgent",
  high: "sla-high",
  normal: "sla-normal",
  low: "sla-low",
} as const;

/** A resolution SLA still running, due `in` from now. */
const pending = (dueIn: number) =>
  ({
    type: "resolution",
    status: "pending",
    dueAt: at(dueIn),
    completedAt: null,
    breachedAt: null,
  }) as const;

/** A resolution SLA that blew its deadline `ago` before now. */
const breached = (ago: number) =>
  ({
    type: "resolution",
    status: "breached",
    dueAt: at(-ago),
    completedAt: null,
    breachedAt: at(-ago),
  }) as const;

/** A resolution SLA satisfied `ago` before now, with `dueAt` still in the past. */
const met = (ago: number, dueAgo: number) =>
  ({
    type: "resolution",
    status: "completed",
    dueAt: at(-dueAgo),
    completedAt: at(-ago),
    breachedAt: null,
  }) as const;

export const MOCK_TICKETS: QueueTicket[] = [
  {
    id: "t-4823",
    number: 4823,
    subject: "Chat widget stuck on 'Connecting…'",
    status: "new",
    priority: "urgent",
    requester: REQUESTERS.aisha,
    assignee: AGENTS.sam,
    slaPolicyId: SLA_POLICY.urgent,
    slaEvent: pending(22 * MINUTE),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-38 * MINUTE),
    updatedAt: at(-2 * MINUTE),
  },
  {
    id: "t-4822",
    number: 4822,
    subject: "Attachment upload fails over 10 MB",
    status: "new",
    priority: "high",
    requester: REQUESTERS.ellie,
    assignee: null,
    slaPolicyId: SLA_POLICY.high,
    slaEvent: pending(55 * MINUTE),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-65 * MINUTE),
    updatedAt: at(-8 * MINUTE),
  },
  {
    id: "t-4821",
    number: 4821,
    subject: "Duplicate charge on invoice INV-2291",
    status: "open",
    priority: "high",
    requester: REQUESTERS.dana,
    assignee: AGENTS.priya,
    slaPolicyId: SLA_POLICY.high,
    slaEvent: pending(HOUR + 12 * MINUTE),
    firstResponseAt: at(-30 * MINUTE),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-2 * HOUR),
    updatedAt: at(-12 * MINUTE),
  },
  {
    id: "t-4819",
    number: 4819,
    subject: "Can't log in after SSO switch — 400 error",
    status: "open",
    priority: "urgent",
    requester: REQUESTERS.marcus,
    assignee: AGENTS.sam,
    slaPolicyId: SLA_POLICY.urgent,
    slaEvent: breached(26 * MINUTE),
    firstResponseAt: at(-3 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-4 * HOUR),
    updatedAt: at(-18 * MINUTE),
  },
  {
    id: "t-4818",
    number: 4818,
    subject: "SAML metadata URL rejected",
    status: "open",
    priority: "high",
    requester: REQUESTERS.tom,
    assignee: AGENTS.ava,
    slaPolicyId: SLA_POLICY.high,
    slaEvent: breached(12 * MINUTE),
    firstResponseAt: at(-5 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-6 * HOUR),
    updatedAt: at(-24 * MINUTE),
  },
  {
    id: "t-4817",
    number: 4817,
    subject: "API returns 502 on /v2/exports",
    status: "pending",
    priority: "urgent",
    requester: REQUESTERS.tomas,
    assignee: AGENTS.priya,
    slaPolicyId: SLA_POLICY.urgent,
    slaEvent: pending(48 * MINUTE),
    firstResponseAt: at(-90 * MINUTE),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-2 * HOUR),
    updatedAt: at(-31 * MINUTE),
  },
  {
    id: "t-4816",
    number: 4816,
    subject: "Refund not reflected on statement",
    status: "pending",
    priority: "normal",
    requester: REQUESTERS.grace,
    assignee: AGENTS.priya,
    slaPolicyId: SLA_POLICY.normal,
    slaEvent: pending(6 * HOUR + 40 * MINUTE),
    firstResponseAt: at(-2 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-5 * HOUR),
    updatedAt: at(-40 * MINUTE),
  },
  {
    id: "t-4814",
    number: 4814,
    subject: "Bulk CSV import for contacts",
    status: "new",
    priority: "low",
    requester: REQUESTERS.lena,
    assignee: null,
    slaPolicyId: SLA_POLICY.low,
    slaEvent: pending(3 * DAY + 4 * HOUR),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-90 * MINUTE),
    updatedAt: at(-HOUR),
  },
  {
    id: "t-4813",
    number: 4813,
    subject: "Macro variables render blank whenever the template contains a nested conditional",
    status: "open",
    priority: "normal",
    requester: REQUESTERS.ravi,
    assignee: AGENTS.sam,
    slaPolicyId: SLA_POLICY.normal,
    slaEvent: pending(8 * HOUR),
    firstResponseAt: at(-100 * MINUTE),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-3 * HOUR),
    updatedAt: at(-2 * HOUR),
  },
  {
    id: "t-4811",
    number: 4811,
    subject: "Timezone off by one hour in scheduled reports",
    status: "on_hold",
    priority: "low",
    requester: REQUESTERS.ian,
    assignee: AGENTS.ava,
    slaPolicyId: SLA_POLICY.low,
    slaEvent: pending(2 * DAY),
    firstResponseAt: at(-4 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-8 * HOUR),
    updatedAt: at(-3 * HOUR),
  },
  {
    id: "t-4809",
    number: 4809,
    subject: "Seat count didn't update after upgrade",
    status: "on_hold",
    priority: "normal",
    requester: REQUESTERS.ravi,
    assignee: AGENTS.ava,
    slaPolicyId: SLA_POLICY.normal,
    slaEvent: pending(5 * HOUR + 20 * MINUTE),
    firstResponseAt: at(-5 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-9 * HOUR),
    updatedAt: at(-4 * HOUR),
  },
  {
    id: "t-4806",
    number: 4806,
    subject: "Agent can see another team's queue",
    status: "open",
    priority: "urgent",
    requester: REQUESTERS.marcus,
    assignee: AGENTS.priya,
    slaPolicyId: SLA_POLICY.urgent,
    slaEvent: breached(HOUR + 40 * MINUTE),
    firstResponseAt: at(-4 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-6 * HOUR),
    updatedAt: at(-5 * HOUR),
  },
  {
    id: "t-4803",
    number: 4803,
    subject: "Password reset email never arrives for addresses on the corporate domain",
    status: "pending",
    priority: "high",
    requester: REQUESTERS.chloe,
    assignee: null,
    slaPolicyId: SLA_POLICY.high,
    slaEvent: breached(2 * HOUR + 5 * MINUTE),
    firstResponseAt: at(-7 * HOUR),
    resolvedAt: null,
    closedAt: null,
    createdAt: at(-10 * HOUR),
    updatedAt: at(-6 * HOUR),
  },
  {
    id: "t-4790",
    number: 4790,
    subject: "Rate limit hit on /v2/tickets",
    status: "resolved",
    priority: "high",
    requester: REQUESTERS.tomas,
    assignee: AGENTS.priya,
    slaPolicyId: SLA_POLICY.high,
    slaEvent: met(DAY, 20 * HOUR),
    firstResponseAt: at(-DAY - 3 * HOUR),
    resolvedAt: at(-DAY),
    closedAt: null,
    createdAt: at(-DAY - HOUR - 12 * MINUTE),
    updatedAt: at(-DAY),
  },
  {
    id: "t-4776",
    number: 4776,
    subject: "CSAT survey sent twice",
    status: "closed",
    priority: "normal",
    requester: REQUESTERS.ellie,
    assignee: AGENTS.sam,
    slaPolicyId: SLA_POLICY.normal,
    slaEvent: met(3 * DAY, 2 * DAY),
    firstResponseAt: at(-3 * DAY - 2 * HOUR),
    resolvedAt: at(-3 * DAY),
    closedAt: at(-3 * DAY),
    createdAt: at(-3 * DAY - 2 * HOUR - 30 * MINUTE),
    updatedAt: at(-3 * DAY),
  },
];
