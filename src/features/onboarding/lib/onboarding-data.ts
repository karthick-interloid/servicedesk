import type { Tone } from "@/lib/badge-tones";

/** From the design's `days` list — Mon–Fri arrive pre-selected (`i < 5`). */
export const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DEFAULT_WORKING_DAYS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Mirrors `public.ticket_priority` in supabase/schemas/types/00_types.sql. */
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type SlaTarget = {
  priority: string;
  /** The enum value written to `sla_policies.priority_scope`; `priority` is only a label. */
  scope: TicketPriority;
  tone: Tone;
  firstReply: string;
  resolve: string;
  /** `sla_policies.first_response_mins` — the numeric form of `firstReply`. */
  firstReplyMins: number;
  /** `sla_policies.resolution_mins` — the numeric form of `resolve`. */
  resolveMins: number;
};

/**
 * What "1 business day" is worth in minutes, for converting the display strings below.
 *
 * EXPORTED so the SLA editor's duration parser converts with the same constant this file
 * used, rather than a second copy that could drift. See
 * `src/features/settings/lib/duration.ts`.
 */
export const BUSINESS_DAY_MINS = 8 * 60;

/**
 * Transcribed verbatim from `Update design.dc.html` → `const priRows`, in source order.
 *
 * READ-ONLY by design: the markup renders each row as a pill plus two text values, with no
 * input, select or editable control anywhere in the `wizIs2` body. Rendered as shown.
 *
 * The minute values are stated rather than parsed out of the prose — "8 business hours" and
 * "2 business days" have no single reading, so pinning them here keeps the number the
 * database gets tied to the string the user was shown.
 *
 * CAVEAT: nothing yet honours the "business" in "business hours". These are stored as plain
 * minute durations, so until an SLA calculator reads `business_hours.schedule_json`, a
 * 480-minute target elapses over 8 wall-clock hours including overnight, not 8 working ones.
 */
export const SLA_TARGETS: SlaTarget[] = [
  {
    priority: "Urgent",
    scope: "urgent",
    tone: "error",
    firstReply: "15 minutes",
    resolve: "4 hours",
    firstReplyMins: 15,
    resolveMins: 4 * 60,
  },
  {
    priority: "High",
    scope: "high",
    tone: "warning",
    firstReply: "1 hour",
    resolve: "8 business hours",
    firstReplyMins: 60,
    resolveMins: 8 * 60,
  },
  {
    priority: "Normal",
    scope: "normal",
    tone: "info",
    firstReply: "4 business hours",
    resolve: "2 business days",
    firstReplyMins: 4 * 60,
    resolveMins: 2 * BUSINESS_DAY_MINS,
  },
  {
    priority: "Low",
    scope: "low",
    tone: "neutral",
    firstReply: "1 business day",
    resolve: "5 business days",
    firstReplyMins: BUSINESS_DAY_MINS,
    resolveMins: 5 * BUSINESS_DAY_MINS,
  },
];

/** The design's `Invite as` options, in source order. */
export const INVITE_ROLES = ["Agent", "Manager", "Billing Admin"] as const;

/** The design's seeded step-3 value. */
export const SEED_INVITE_EMAILS = "priya@northwind.io, sam@northwind.io";

export const STEP_LABELS = ["Business hours", "First SLA policy", "Invite your team"] as const;

/**
 * The org name the wizard's copy addresses, as the design hard-codes it.
 *
 * It used to be `ORG.name` from `features/shell/lib/identity`, but that module became an
 * async Supabase read and dropped the constant, leaving the wizard importing a name that
 * no longer exists. The wizard is a Client Component, so it cannot call the async one;
 * until onboarding is wired to the real tenant it renders the design's static value from
 * here, beside the rest of the wizard's seeded copy.
 */
export const ONBOARDING_ORG_NAME = "Northwind Support";
