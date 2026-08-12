import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  PERIOD_DAYS,
  PERIOD_WEEKS,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  REPORTS_PERIOD_LABEL,
  type AgentLoadRow,
  type FirstResponseWeek,
  type ReportsOverview,
  type SlaPriorityRow,
} from "@/features/reports/types";
import type { TicketPriority, TicketStatus } from "@/lib/badge-tones";

/**
 * Reports — the only module that talks to Supabase for the dashboard's figures.
 *
 * ⚠ SERVER ONLY, same contract as `features/tickets/services/ticket.service.ts`.
 *
 * ONE round trip. Every figure comes from `public.reports_overview()`, a SECURITY INVOKER
 * SQL function, so `tickets_select`, the `sla_events` policies and `memberships_select`
 * are what scope the rows it aggregates — there is no tenant filter anywhere in this file
 * or in the function. See `supabase/schemas/functions/08_reports_overview.sql`.
 *
 * Why an RPC and not client-side reduction: the medians are `percentile_cont`, and the
 * weekly series needs a generated week spine so an empty week still renders a bar. Neither
 * is expressible through PostgREST, and doing them in TypeScript would mean pulling every
 * ticket in the tenant into the RSC payload to sort it.
 *
 * ── TWO HONEST GAPS, both surfaced rather than faked ──────────────────────────────────
 *
 * 1. CSAT is `null`, always. No satisfaction table exists in the schema.
 *
 * 2. EVERY DURATION IS WALL CLOCK. The design's subtitle says "business hours only";
 *    honouring `business_hours.schedule_json` means subtracting nights, weekends and
 *    `holidays_json` from each interval, which is a real calculation and not a swap. It is
 *    deferred — and because presenting wall-clock timing under a "business hours only"
 *    caption would be a quiet lie, `periodLabel` says what is actually being measured.
 */

type OverviewJson = {
  volume: { created: number; resolved: number } | null;
  tickets_solved: number | null;
  status_breakdown: { status: string; tickets: number }[] | null;
  priority_mix: { priority: string; tickets: number }[] | null;
  sla_by_priority: { priority: string; tickets: number; met: number }[] | null;
  sla_clocks: {
    cur_total: number;
    cur_met: number;
    prev_total: number;
    prev_met: number;
  } | null;
  median_first_response_min: number | null;
  first_response_target_min: number | null;
  first_response_weeks: { week: string; minutes: number }[] | null;
  resolution: { median_hours: number | null; p90_hours: number | null } | null;
  agent_load:
    | {
        id: string;
        full_name: string;
        open: number;
        solved: number;
        median_first_reply_min: number;
        sla_met: number;
        sla_total: number;
      }[]
    | null;
};

/** `met / total` as a whole percentage, and 0 rather than NaN when nothing closed. */
function pct(met: number, total: number): number {
  return total === 0 ? 0 : Math.round((met / total) * 100);
}

/** Same, to one decimal — the headline tile's precision. */
function pct1(met: number, total: number): number {
  return total === 0 ? 0 : Math.round((met / total) * 1000) / 10;
}

export async function getReportsOverview(): Promise<ReportsOverview> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("reports_overview", {
    p_days: PERIOD_DAYS,
    p_weeks: PERIOD_WEEKS,
  });

  if (error) {
    console.error("[reports] reports_overview failed", error);
    throw new Error("We couldn't load your reports.");
  }

  const json = (data ?? {}) as OverviewJson;

  const clocks = json.sla_clocks ?? { cur_total: 0, cur_met: 0, prev_total: 0, prev_met: 0 };
  const currentPct = pct1(clocks.cur_met, clocks.cur_total);
  const previousPct = pct1(clocks.prev_met, clocks.prev_total);

  // The by-priority card lists urgent → low in the design's own order, and it lists all
  // four even when a priority closed no clocks in the period — a missing row would silently
  // change the card's height and read as "no urgent tickets" rather than "none closed".
  const byPriority = new Map(
    (json.sla_by_priority ?? []).map((row) => [row.priority as TicketPriority, row]),
  );

  const slaByPriority: SlaPriorityRow[] = PRIORITY_ORDER.map((priority) => {
    const row = byPriority.get(priority);
    const tickets = row?.tickets ?? 0;
    const met = row?.met ?? 0;

    return { priority, label: PRIORITY_LABEL[priority], tickets, met, metPct: pct(met, tickets) };
  });

  const agentLoad: AgentLoadRow[] = (json.agent_load ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    open: row.open,
    solved: row.solved,
    medianFirstReplyMin: row.median_first_reply_min,
    slaMetPct: pct(row.sla_met, row.sla_total),
  }));

  const firstResponseWeeks: FirstResponseWeek[] = (json.first_response_weeks ?? []).map((row) => ({
    week: row.week,
    minutes: row.minutes,
  }));

  return {
    periodLabel: REPORTS_PERIOD_LABEL,

    slaAttainmentPct: currentPct,
    slaAttainmentDeltaPts: Math.round((currentPct - previousPct) * 10) / 10,
    medianFirstResponseMin: json.median_first_response_min ?? 0,
    firstResponseTargetMin: json.first_response_target_min ?? 60,
    ticketsSolved: json.tickets_solved ?? 0,

    slaByPriority,
    firstResponseWeeks,
    agentLoad,

    volume: json.volume ?? { created: 0, resolved: 0 },
    statusBreakdown: (json.status_breakdown ?? []).map((row) => ({
      status: row.status as TicketStatus,
      tickets: row.tickets,
    })),
    priorityMix: (json.priority_mix ?? []).map((row) => ({
      priority: row.priority as TicketPriority,
      tickets: row.tickets,
    })),
    resolution: {
      medianHours: json.resolution?.median_hours ?? null,
      p90Hours: json.resolution?.p90_hours ?? null,
    },

    csat: null,
  };
}
