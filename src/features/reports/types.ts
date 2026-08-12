import type { TicketPriority, TicketStatus } from "@/lib/badge-tones";

/**
 * The Reports screen's demo states.
 *
 * The design registers exactly two (`states: ["Default", "Loading"]` in the capture
 * report) — there is no empty state and no error state on this screen, unlike the queue's
 * four. Reports is an aggregate view: with no tickets the figures are zeroes, not an empty
 * card, and the design draws no zero-state for them. Noted in docs/REPORTS-DIFF.md.
 *
 * `loading` is now produced by `app/(app)/reports/loading.tsx` against the real await,
 * not by a query parameter.
 */
export type ReportsState = "default" | "loading";

/** The reporting window. The design draws no date-range control, so this is not a prop. */
export const PERIOD_DAYS = 30;

/** The chart's eight bars. Measured off the design: eight columns, ISO-week labels. */
export const PERIOD_WEEKS = 8;

/**
 * The subtitle under the page title.
 *
 * The design's own line is "Last 30 days · business hours only · all queues". The middle
 * qualifier is deliberately NOT reproduced: every duration on this screen is wall clock,
 * because honouring `business_hours.schedule_json` means subtracting nights, weekends and
 * `holidays_json` from each interval — a real calculation, deferred. Printing "business
 * hours only" over wall-clock figures would be a quiet lie, so the caption says what is
 * actually being measured. Logged in docs/WIRING-SAVEDVIEWS-REPORTS.md § Deviations.
 *
 * Shared by the service and the loading state so the two cannot print different periods.
 */
export const REPORTS_PERIOD_LABEL = `Last ${PERIOD_DAYS} days · wall-clock timing · all queues`;

/** One row of the "SLA attainment by priority" card. */
export type SlaPriorityRow = {
  priority: TicketPriority;
  /** The design's display label for the priority badge. */
  label: string;
  /** Resolution SLA clocks that closed inside the period. */
  tickets: number;
  /** …of which met their deadline. Carried as a COUNT so the percentage cannot drift. */
  met: number;
  /** DERIVED — `round(met / tickets * 100)`. Never stored. */
  metPct: number;
};

/** One row of the Agent load table. */
export type AgentLoadRow = {
  /** `users.id` */
  id: string;
  /** `users.full_name` */
  fullName: string;
  /** Tickets assigned and not `resolved`/`closed`. */
  open: number;
  /** Tickets they resolved inside the period. */
  solved: number;
  /** Median minutes from `created_at` to `first_response_at`. */
  medianFirstReplyMin: number;
  /** DERIVED — SLA clocks met over clocks closed. 0 when they closed none. */
  slaMetPct: number;
};

/** One bar of the median-first-response chart. */
export type FirstResponseWeek = {
  /** ISO week label, e.g. "W30". */
  week: string;
  minutes: number;
};

/**
 * Everything the Reports screen renders, as one value.
 *
 * Produced by `public.reports_overview()` — see
 * `supabase/schemas/functions/08_reports_overview.sql` for how each figure is computed
 * and why the RPC exists at all.
 */
export type ReportsOverview = {
  /** The subtitle line under the page title. */
  periodLabel: string;
  slaAttainmentPct: number;
  slaAttainmentDeltaPts: number;
  medianFirstResponseMin: number;
  firstResponseTargetMin: number;
  ticketsSolved: number;
  slaByPriority: SlaPriorityRow[];
  firstResponseWeeks: FirstResponseWeek[];
  agentLoad: AgentLoadRow[];

  /**
   * Real aggregates the design's screen has nowhere to render.
   *
   * They are computed and returned rather than dropped because they were explicitly in
   * scope for the wiring, and because the moment a card is designed for any of them the
   * data is already there. Nothing on the current screen reads them — `Update design.dc.html`
   * draws four KPI tiles, one chart, the SLA card and the agent table, and no more.
   */
  volume: { created: number; resolved: number };
  statusBreakdown: { status: TicketStatus; tickets: number }[];
  priorityMix: { priority: TicketPriority; tickets: number }[];
  /** Wall-clock hours, NOT business hours — see `csat` below and the RPC's header. */
  resolution: { medianHours: number | null; p90Hours: number | null };

  /**
   * ALWAYS NULL, and it is not an oversight.
   *
   * There is no satisfaction/rating/survey table anywhere in `supabase/schemas/`, so CSAT
   * has nothing behind it — not a missing join, an absent feature. The tile renders an
   * explicit "not available" rather than being removed, so the design's measured four-tile
   * grid survives and the gap is visible instead of silently papered over. Typed as a
   * nullable value rather than omitted so the day a ratings table lands, this is the only
   * line that changes.
   */
  csat: { score: number; outOf: number; ratings: number } | null;
};

/**
 * The bar tone under each priority row.
 *
 * ⚠ This is NOT `ticketPriorityTone`. The design paints these bars #DC2626 / #D97706 /
 * #166534 / #166534 — measured off `reports--light.png` — where the priority BADGE on the
 * same row is error / warning / info / neutral. So `Normal` gets an indigo badge and a
 * green bar in the same row, by the design's own hand. treatments.md §5.8 says bar tone
 * "follows the thing measured, not the value", and what these bars measure is attainment,
 * not priority. Kept as an explicit per-priority map rather than a threshold function so it
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

/** Priority → the design's display label, in the order the SLA card lists them. */
export const PRIORITY_ORDER: readonly TicketPriority[] = ["urgent", "high", "normal", "low"];

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};
