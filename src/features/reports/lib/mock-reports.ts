/**
 * ███  M O C K   D A T A  —  R E P L A C E   A T   W I R I N G  ███
 *
 * Nothing here touches the network. Every figure the Reports screen renders is either
 * DERIVED (computed in this file from another figure, so the two can never disagree) or
 * SYNTHETIC (a hand-set constant transcribed from the design). The distinction is marked
 * on every export, because a reports screen is the one place where a number that quietly
 * contradicts its own breakdown reads as a bug rather than as placeholder copy.
 *
 * ── Why this is not reduced out of MOCK_TICKETS ──────────────────────────────────────
 * `features/tickets/lib/mock-tickets.ts` is a FIFTEEN-ROW LIVE-QUEUE SNAPSHOT, frozen at
 * `QUEUE_NOW` (2026-08-10) and deliberately skewed so every badge tone and layout branch
 * renders on page one (its own header says so: urgent ×4 · high ×5 · normal ×4 · low ×2).
 * Reports is a THIRTY-DAY AGGREGATE of 1,204 solved tickets. Reducing the snapshot would
 * produce a 15-ticket queue's shape — urgent-heavy, no resolved history, three agents —
 * which contradicts the design on every visible number. So the aggregates are synthetic,
 * and what IS taken from the ticket mock is taken by reference:
 *
 *   · the agent roster (id + fullName) is READ OUT of MOCK_TICKETS' assignees, so an agent
 *     cannot drift out of sync with the tickets pointing at them — see `queueAgents()`;
 *   · the priority axis is keyed by `TicketPriority` (the Postgres enum in
 *     `supabase/schemas/types/00_types.sql`), and its colour resolves through
 *     `lib/badge-tones.ts`, never a literal;
 *   · `LIVE_QUEUE_OPEN_BY_AGENT` is a real reduction over MOCK_TICKETS, exported so the
 *     wiring slice has the shape of the query it replaces and so the relationship the
 *     table asserts (a 30-day backlog is a superset of today's queue page) is checkable.
 *
 * ── The coherence contract ───────────────────────────────────────────────────────────
 * Four relationships hold by construction, not by my having typed matching numbers:
 *   1. TICKETS_SOLVED is the SUM of SLA_BY_PRIORITY's ticket counts.        (1,204)
 *   2. Every "% met" is round(met / tickets * 100) off integer counts — no
 *      percentage is stored, so none can drift from its own numerator.
 *   3. MEDIAN_FIRST_RESPONSE_MIN is the LAST POINT of FIRST_RESPONSE_WEEKS.     (38m)
 *   4. SLA_ATTAINMENT_PCT is met/total over BOTH clocks a ticket runs (first
 *      response and resolution), which is why it sits BELOW the resolution-only
 *      weighted mean of the by-priority card — see the note on SLA_CLOCKS.
 *
 * Two figures in the design do not reconcile and are transcribed as-is under the standing
 * "design wins" rule. Both are logged in docs/REPORTS-DIFF.md § Numbers that do not
 * reconcile: the four listed agents solve 249 of the org's 1,204, and the org median first
 * response (38m) is slower than three of the four agents' medians.
 */

import { MOCK_TICKETS } from "@/features/tickets/lib/mock-tickets";
import type { TicketPriority } from "@/lib/badge-tones";

/* ══════════════════════════════════════════════════════════════════════════════════════
   The reporting period. The design draws NO date-range control — the period is a static
   subtitle line ("Last 30 days · business hours only · all queues") and the capture
   report records no <select> on this screen. Nothing re-slices; see REPORTS-DIFF.md.
   ══════════════════════════════════════════════════════════════════════════════════════ */

/** SYNTHETIC — transcribed from the design's page subtitle. */
export const REPORT_PERIOD = {
  range: "Last 30 days",
  qualifiers: ["business hours only", "all queues"],
} as const;

/** DERIVED — the subtitle string the header renders. */
export const REPORT_PERIOD_LABEL = [REPORT_PERIOD.range, ...REPORT_PERIOD.qualifiers].join(" · ");

/* ══════════════════════════════════════════════════════════════════════════════════════
   SLA attainment by priority — the right-hand card.
   ══════════════════════════════════════════════════════════════════════════════════════ */

export type SlaPriorityRow = {
  priority: TicketPriority;
  /** The design's display label for the priority badge. */
  label: string;
  /** Resolution SLA clocks that closed inside the period. */
  tickets: number;
  /** …of which met their deadline. Stored as a COUNT so the percentage cannot drift. */
  met: number;
};

/**
 * SYNTHETIC counts, ordered urgent → low exactly as the design lists them.
 *
 * `met` is set so `round(met / tickets * 100)` reproduces the design's printed 88 / 93 /
 * 96 / 99 — the percentages are never stored. The ticket counts are the design's own and
 * already sum to its "Tickets solved" figure, which is the relationship TICKETS_SOLVED
 * below makes structural rather than coincidental.
 */
const SLA_BY_PRIORITY_ROWS: readonly SlaPriorityRow[] = [
  { priority: "urgent", label: "Urgent", tickets: 142, met: 125 }, // 88.0%
  { priority: "high", label: "High", tickets: 318, met: 296 }, // 93.1%
  { priority: "normal", label: "Normal", tickets: 604, met: 580 }, // 96.0%
  { priority: "low", label: "Low", tickets: 140, met: 139 }, // 99.3%
];

/** DERIVED — each row carries its own rounded percentage, computed from the counts. */
export const SLA_BY_PRIORITY = SLA_BY_PRIORITY_ROWS.map((row) => ({
  ...row,
  metPct: Math.round((row.met / row.tickets) * 100),
}));

/**
 * The bar tone under each priority row.
 *
 * ⚠ This is NOT `ticketPriorityTone`. The design paints these bars #DC2626 / #D97706 /
 * #166534 / #166534 — measured off `reports--light.png` — where the priority BADGE on the
 * same row is error / warning / info / neutral. So `Normal` gets an indigo badge and a
 * green bar in the same row, by the design's own hand. treatments.md §5.8 says bar tone
 * "follows the thing measured, not the value", and what these bars measure is attainment,
 * not priority — green once the row is comfortably above target, amber and red as it
 * falls away. Kept as an explicit per-priority map rather than a threshold function so it
 * reproduces the design exactly instead of guessing at cut-offs the design never states.
 *
 * Every value is a token, and no row is distinguished by colour alone: each carries its
 * priority badge, its "N% met" figure and its ticket count as text.
 */
export const SLA_BAR_TONE: Record<TicketPriority, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  normal: "bg-chart-1",
  low: "bg-chart-1",
};

/* ══════════════════════════════════════════════════════════════════════════════════════
   The four KPI tiles.
   ══════════════════════════════════════════════════════════════════════════════════════ */

/**
 * DERIVED — the sum of the by-priority breakdown. This is the coherence the design itself
 * has (142 + 318 + 604 + 140 = 1,204); computing it means the two cards cannot fall out
 * of step if a row is ever edited.
 */
export const TICKETS_SOLVED = SLA_BY_PRIORITY.reduce((sum, row) => sum + row.tickets, 0);

/**
 * SYNTHETIC — the org's SLA clocks for the period.
 *
 * Every solved ticket runs TWO clocks: a first-response target and a resolution target.
 * `resolution` is therefore the by-priority card's own totals (1,204 / 1,140), and
 * `firstResponse` is the second clock on the same 1,204 tickets.
 *
 * This is what reconciles the two SLA figures on the screen. The by-priority card is
 * resolution-only and weights out to 94.7%; the headline tile counts both clocks and
 * lands at 94.2%, because first response is the weaker of the two (93.7%). Without the
 * split the headline would look like a rounding error against its own breakdown.
 */
const SLA_CLOCKS = {
  resolution: {
    total: TICKETS_SOLVED,
    met: SLA_BY_PRIORITY.reduce((sum, row) => sum + row.met, 0), // 1,140
  },
  firstResponse: { total: TICKETS_SOLVED, met: 1128 }, // 93.7%
} as const;

/** DERIVED — met / total across both clocks. Renders as the design's 94.2%. */
export const SLA_ATTAINMENT_PCT =
  Math.round(
    ((SLA_CLOCKS.resolution.met + SLA_CLOCKS.firstResponse.met) /
      (SLA_CLOCKS.resolution.total + SLA_CLOCKS.firstResponse.total)) *
      1000,
  ) / 10;

/** SYNTHETIC — the same measure over the preceding period, for the delta line. */
const SLA_ATTAINMENT_PREV_PCT = 92.4;

/** DERIVED — "+1.8 pts vs last month" in the design. */
export const SLA_ATTAINMENT_DELTA_PTS =
  Math.round((SLA_ATTAINMENT_PCT - SLA_ATTAINMENT_PREV_PCT) * 10) / 10;

/**
 * SYNTHETIC — median first response, in minutes, for the eight ISO weeks the chart spans.
 *
 * A SMOOTH SERIES, not noise: it opens at 52m, improves week over week, spikes to 58m at
 * W26 (the design's tallest bar) and settles into the high thirties. The mock tickets
 * cannot support this — they are dated across a few hours of one day, not eight weeks —
 * so the shape is authored. It is plausible rather than random: no week moves by more
 * than the spike, and the trend is monotone either side of it.
 */
export const FIRST_RESPONSE_WEEKS = [
  { week: "W23", minutes: 52 },
  { week: "W24", minutes: 47 },
  { week: "W25", minutes: 44 },
  { week: "W26", minutes: 58 },
  { week: "W27", minutes: 41 },
  { week: "W28", minutes: 36 },
  { week: "W29", minutes: 39 },
  { week: "W30", minutes: 38 },
] as const;

/** SYNTHETIC — the first-response target the dashed reference line marks. */
export const FIRST_RESPONSE_TARGET_MIN = 60;

/**
 * DERIVED — the headline tile is the LAST point of the series above, so the "38m" on the
 * tile and the "38m" over the final bar are the same number read twice.
 */
export const MEDIAN_FIRST_RESPONSE_MIN =
  FIRST_RESPONSE_WEEKS[FIRST_RESPONSE_WEEKS.length - 1]?.minutes ?? 0;

/**
 * SYNTHETIC — CSAT.
 *
 * ⚠ NO SCHEMA SUPPORT. There is no satisfaction/rating table anywhere in
 * `supabase/schemas/` — the closest thing is the design's own customer-record CSAT column,
 * which is equally unbacked. This tile cannot be wired without a new table; it is
 * reproduced because the design draws it, and it is the one metric on this screen with
 * nothing behind it. Reported in docs/REPORTS-DIFF.md § Metrics with no data behind them.
 */
export const CSAT = { score: 4.6, outOf: 5, ratings: 312 } as const;

/* ══════════════════════════════════════════════════════════════════════════════════════
   Agent load.
   ══════════════════════════════════════════════════════════════════════════════════════ */

/**
 * TICKET-DERIVED — the distinct assignees on MOCK_TICKETS, in first-seen order.
 *
 * Read out rather than re-typed so an agent's id and display name cannot drift away from
 * the tickets that point at them. The wiring slice replaces this with a memberships read.
 */
function queueAgents() {
  const seen = new Map<string, { id: string; fullName: string }>();

  for (const ticket of MOCK_TICKETS) {
    if (ticket.assignee && !seen.has(ticket.assignee.id)) {
      seen.set(ticket.assignee.id, {
        id: ticket.assignee.id,
        fullName: ticket.assignee.fullName,
      });
    }
  }

  return seen;
}

const QUEUE_AGENTS = queueAgents();

/**
 * TICKET-DERIVED — open tickets per assignee in the live queue snapshot.
 *
 * A real reduction: everything not `resolved` or `closed`, keyed by assignee id. It is not
 * what the table prints — the table's OPEN column is a 30-day backlog and MOCK_TICKETS is
 * one page of today's queue — but it is the shape of the query that replaces it, and it
 * makes the superset relationship the table asserts checkable rather than asserted.
 */
export const LIVE_QUEUE_OPEN_BY_AGENT = MOCK_TICKETS.reduce<Record<string, number>>(
  (counts, ticket) => {
    if (!ticket.assignee) return counts;
    if (ticket.status === "resolved" || ticket.status === "closed") return counts;

    counts[ticket.assignee.id] = (counts[ticket.assignee.id] ?? 0) + 1;
    return counts;
  },
  {},
);

/**
 * Jonah Klein has no ticket in MOCK_TICKETS but appears in the design's Agent load table
 * and in its avatar specimens ("JK"). He is declared here rather than smuggled into the
 * ticket mock — and his being the newest agent is exactly consistent with his having the
 * lightest row in the table (3 open, 28 solved).
 */
const JONAH = { id: "u-jonah-klein", fullName: "Jonah Klein" } as const;

/** Resolves an agent from the queue-derived roster, or falls back to a declared one. */
function agent(id: string, fallback: { id: string; fullName: string }) {
  return QUEUE_AGENTS.get(id) ?? fallback;
}

export type AgentLoadRow = {
  id: string;
  fullName: string;
  /** Open backlog over the period. SYNTHETIC — see LIVE_QUEUE_OPEN_BY_AGENT. */
  open: number;
  /** Tickets solved in the period. SYNTHETIC. */
  solved: number;
  /** Median first reply, minutes. SYNTHETIC. */
  medianFirstReplyMin: number;
  /** SLA clocks met, out of `solved * 2` — the same both-clocks model as SLA_CLOCKS. */
  slaMet: number;
};

const AGENT_LOAD_ROWS: readonly AgentLoadRow[] = [
  {
    ...agent("u-priya-raman", { id: "u-priya-raman", fullName: "Priya Raman" }),
    open: 12,
    solved: 86,
    medianFirstReplyMin: 22,
    slaMet: 167, // of 172 → 97%
  },
  {
    ...agent("u-sam-okafor", { id: "u-sam-okafor", fullName: "Sam Okafor" }),
    open: 9,
    solved: 74,
    medianFirstReplyMin: 31,
    slaMet: 139, // of 148 → 94%
  },
  {
    ...agent("u-ava-lindqvist", { id: "u-ava-lindqvist", fullName: "Ava Lindqvist" }),
    open: 7,
    solved: 61,
    medianFirstReplyMin: 44,
    slaMet: 112, // of 122 → 92%
  },
  { ...JONAH, open: 3, solved: 28, medianFirstReplyMin: 36, slaMet: 54 }, // of 56 → 96%
];

/**
 * DERIVED — each row's SLA-met percentage, computed off the same both-clocks denominator
 * the org tile uses (`solved * 2`). Reproduces the design's printed 97 / 94 / 92 / 96
 * without any of those percentages being stored.
 */
export const AGENT_LOAD = AGENT_LOAD_ROWS.map((row) => ({
  ...row,
  slaMetPct: Math.round((row.slaMet / (row.solved * 2)) * 100),
}));
