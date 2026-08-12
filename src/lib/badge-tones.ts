/**
 * Single source for every status pill. Required by components-map.md rule 5:
 * "Status and priority colour always resolves through `lib/badge-tones.ts`, never a literal
 * Tailwind palette class."
 *
 * Recipe from docs/treatments.md §3.1 — soft surface + strong text + 25% inset ring,
 * `rounded-full`, `text-xs`. Every value resolves through a theme token, so a token change
 * repaints every pill and no palette class appears here.
 *
 * `toneClass` and `toneDot` are consumed directly as the additive `tone` cva group in
 * `ui/badge.tsx` (components-map.md row 43). They live here rather than there so the
 * recipe and the semantic mappings below stay in one file, exactly as the design's own
 * `lib/badge-tones.ts` snippet has it.
 */

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "error";

/** tone → classes. `rounded-full` and the inset ring both override stock badge base. */
export const toneClass: Record<Tone, string> = {
  neutral: "rounded-full bg-secondary text-secondary-foreground ring-1 ring-border ring-inset",
  /* Was `bg-accent text-accent-foreground`. The 2026-08-07 sync moved `--accent` onto the
     teal selected-state surface, which silently repainted this badge teal — against the
     design's own rule, quoted in its post-sync `react/lib/badge-tones.ts`: "`--accent` is
     now the selected-state surface (#E7F1F1) and must never appear on a badge (and vice
     versa)", and against the prototype, which measures #DCFCE7/#166534 on the `New` pill.
     `--brand-badge` restores the pre-sync literals as a badge-only pair. See QUEUE-DIFF Q2. */
  brand:
    "rounded-full bg-brand-badge text-brand-badge-foreground ring-1 ring-brand-badge-foreground/20 ring-inset",
  info: "rounded-full bg-info-soft text-info-strong ring-1 ring-info/25 ring-inset",
  success: "rounded-full bg-success-soft text-success-strong ring-1 ring-success/25 ring-inset",
  warning: "rounded-full bg-warning-soft text-warning-strong ring-1 ring-warning/25 ring-inset",
  error:
    "rounded-full bg-destructive-soft text-destructive-strong ring-1 ring-destructive/25 ring-inset",
};

/**
 * Leading dot fill — present when the badge answers *what state is this in* (status, SLA,
 * health), absent when it answers *what kind is this* (priority, plan, category).
 * The fill is the **base** of the triple, never the strong (treatments §3.1).
 */
export const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  /* `--brand-badge-foreground` is #166534 in light — the same value `bg-primary` resolved
     to, so the light render is unchanged — but it also tracks the badge pair into dark,
     where `--primary` stays green-800 and would sit at 2.4:1 on the dark surface. */
  brand: "bg-brand-badge-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
};

/** The design's own mappings, from its `lib/badge-tones.ts` snippet. */
export const priorityTone: Record<string, Tone> = {
  Urgent: "error",
  High: "warning",
  Normal: "info",
  Low: "neutral",
};

/**
 * `New` was `neutral` here, transcribed from the design-system page's `code.badges`
 * snippet. treatments.md **T8** logged that as unresolved against two contrary sources —
 * the canonical prototype renders #DCFCE7/#166534, and the design's own
 * `react/lib/badge-tones.ts` declares `New: BRAND`. Resolved in favour of brand
 * (2026-08-10, your call). See docs/QUEUE-DIFF.md §Badge tones.
 */
export const statusTone: Record<string, Tone> = {
  New: "brand",
  Open: "info",
  Pending: "warning",
  Solved: "success",
};

/* --------------------------------------------------------------------------
   Schema-keyed maps. The four above are keyed by the design's *display labels*,
   which is what the design-system route documents. Real rows arrive keyed by the
   Postgres enums in `supabase/schemas/types/00_types.sql`, so the queue resolves
   through these instead — same recipe, no second source of colour.
   -------------------------------------------------------------------------- */

/** `public.ticket_status`. */
export type TicketStatus = "new" | "open" | "pending" | "on_hold" | "resolved" | "closed";

/** `public.ticket_priority`. */
export type TicketPriority = "low" | "normal" | "high" | "urgent";

/**
 * Derived, not a column — see `src/features/tickets/types.ts`. `met`/`breached` are the
 * settled outcomes; `on_track`/`at_risk` split the pending window at the design's
 * observed 2-hour threshold.
 */
export type SlaState = "on_track" | "at_risk" | "breached" | "met";

/**
 * The design names four statuses (New · Open · Pending · Solved); the schema enum has six.
 * `resolved` takes the tone the design gives `Solved`. `on_hold` and `closed` have no design
 * counterpart and are **derived**: both are neutral — `on_hold` because the only other
 * waiting state (`pending`) already owns warning, `closed` because a terminal row should
 * recede. Neither is colour-only; both carry their label. Flagged in QUEUE-DIFF.md.
 */
export const ticketStatusTone: Record<TicketStatus, Tone> = {
  new: "brand",
  open: "info",
  pending: "warning",
  on_hold: "neutral",
  resolved: "success",
  closed: "neutral",
};

export const ticketPriorityTone: Record<TicketPriority, Tone> = {
  urgent: "error",
  high: "warning",
  normal: "info",
  low: "neutral",
};

export const slaStateTone: Record<SlaState, Tone> = {
  on_track: "success",
  at_risk: "warning",
  breached: "error",
  met: "success",
};
