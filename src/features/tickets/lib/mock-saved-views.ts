/**
 * ███  M O C K   D A T A  —  R E P L A C E   A T   W I R I N G  ███
 *
 * Nothing in this file touches the network. The rows below are hand-written to the exact
 * shape of `SavedView` (src/features/tickets/types.ts), which mirrors the per-user-scoped
 * `saved_views` query documented there — so the wiring slice deletes this module, swaps
 * `MOCK_SAVED_VIEWS` for the query result, and `saved-views-list.tsx` is untouched.
 *
 * ⚠ TWO FIELDS ARE POPULATED BUT NEVER RENDERED — `isShared` and `owner`.
 *   The design (`Update design.dc.html`, screen `views`) has NO shared/private treatment
 *   on this screen and never shows who created a view. They are varied here anyway so the
 *   rows already carry what a real query returns, and so the moment a design lands for
 *   shared-vs-private the data behind it is real. See docs/SAVED-VIEWS-DIFF.md.
 *
 * ⚠ `ticketCount` IS DERIVED, not a column — `count(*)` over `tickets` matching
 *   `filterJson`. The numbers below are the design's own (19 · 0 · 5 · 4 · 5 for the five
 *   views it ships) plus plausible values for the five this file adds.
 *
 * Row composition, so the list exercises every branch the wiring slice will hit:
 *   is_shared   — true ×7 · false ×3
 *   ownership   — current user (`CURRENT_USER_ID`) ×3 · teammates ×7
 *   filter_json — empty `{}` ×1 · status ×4 · assignee ×4 · priority ×3 · sla ×2
 *   names       — short ×8 · long enough to wrap the row at 375 ×2
 *
 * Every private row is owned by `CURRENT_USER_ID` and every teammate-owned row is shared,
 * so this set is exactly what the documented RLS predicate
 * `(is_shared or owner_user_id = auth.uid())` returns for the signed-in agent — the mock
 * is a legal result of the real query, not just the right shape.
 *
 * The FIRST FIVE rows are the design's `views` const verbatim (id, label and count), so
 * the populated screenshot is directly comparable to `design-reference/saved-views--light.png`.
 * Rows 6-10 exist only to satisfy the 8-12 row data contract; the design ships five.
 */

import type { SavedView } from "../types";
import { CURRENT_USER_ID } from "./mock-tickets";

/** The single tenant every mock row belongs to. Real source: the session's tenant. */
const TENANT_ID = "t-northwind";

/** Owners. `sam` is "the current user" — the same id the queue's mock rows use. */
const OWNERS = {
  sam: { id: CURRENT_USER_ID, fullName: "Sam Okafor" },
  priya: { id: "u-priya-raman", fullName: "Priya Raman" },
  ava: { id: "u-ava-lindqvist", fullName: "Ava Lindqvist" },
  maya: { id: "u-maya-okonkwo", fullName: "Maya Okonkwo" },
} as const;

/** Frozen timestamps so the list order and any future "created" column are reproducible. */
const T0 = Date.parse("2026-06-01T09:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(T0 + days * DAY).toISOString();

export const MOCK_SAVED_VIEWS: SavedView[] = [
  /* ---- The five the design ships, in its own order ---------------------- */
  {
    id: "all",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.maya.id,
    owner: OWNERS.maya,
    name: "All open",
    filterJson: { status: ["new", "open", "pending", "on_hold"] },
    isShared: true,
    ticketCount: 19,
    createdAt: at(0),
    updatedAt: at(0),
  },
  {
    id: "mine",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.maya.id,
    owner: OWNERS.maya,
    name: "My tickets",
    // Stored as the literal "me", not as Maya's id — see `SavedViewFilter.assignee`.
    filterJson: { assignee: "me" },
    isShared: true,
    ticketCount: 0,
    createdAt: at(0),
    updatedAt: at(0),
  },
  {
    id: "unassigned",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.maya.id,
    owner: OWNERS.maya,
    name: "Unassigned",
    filterJson: { assignee: "unassigned" },
    isShared: true,
    ticketCount: 5,
    createdAt: at(0),
    updatedAt: at(0),
  },
  {
    id: "breaching",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.maya.id,
    owner: OWNERS.maya,
    name: "Breaching",
    filterJson: { sla: ["breached", "at_risk"] },
    isShared: true,
    ticketCount: 4,
    createdAt: at(0),
    updatedAt: at(0),
  },
  {
    id: "solved",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.maya.id,
    owner: OWNERS.maya,
    name: "Solved",
    filterJson: { status: ["resolved", "closed"] },
    isShared: true,
    ticketCount: 5,
    createdAt: at(0),
    updatedAt: at(0),
  },

  /* ---- Beyond the design: variety for the wiring slice ------------------ */
  {
    id: "sv-waiting-eng",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.priya.id,
    owner: OWNERS.priya,
    // Long enough to wrap onto a second line at 375.
    name: "Waiting on engineering — escalated",
    filterJson: { status: ["on_hold"], priority: ["urgent", "high"] },
    isShared: true,
    ticketCount: 7,
    createdAt: at(12),
    updatedAt: at(30),
  },
  {
    id: "sv-my-urgent",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.sam.id,
    owner: OWNERS.sam,
    name: "My urgent work",
    filterJson: { assignee: "me", priority: ["urgent"] },
    isShared: false,
    ticketCount: 3,
    createdAt: at(19),
    updatedAt: at(41),
  },
  {
    id: "sv-halcyon",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.sam.id,
    owner: OWNERS.sam,
    name: "Halcyon Bank escalations",
    filterJson: { priority: ["urgent", "high"], sla: ["breached"] },
    isShared: false,
    ticketCount: 2,
    createdAt: at(26),
    updatedAt: at(26),
  },
  {
    id: "sv-triage",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.ava.id,
    owner: OWNERS.ava,
    name: "Morning triage",
    filterJson: { status: ["new"], assignee: "unassigned" },
    isShared: true,
    ticketCount: 11,
    createdAt: at(33),
    updatedAt: at(48),
  },
  {
    id: "sv-everything",
    tenantId: TENANT_ID,
    ownerUserId: OWNERS.sam.id,
    owner: OWNERS.sam,
    // Long name + the empty predicate: `{}` is legal and matches everything.
    name: "Everything, including closed and archived",
    filterJson: {},
    isShared: false,
    ticketCount: 128,
    createdAt: at(40),
    updatedAt: at(52),
  },
];
