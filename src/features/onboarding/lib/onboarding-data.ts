import type { Tone } from "@/lib/badge-tones";

/** From the design's `days` list — Mon–Fri arrive pre-selected (`i < 5`). */
export const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DEFAULT_WORKING_DAYS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type SlaTarget = {
  priority: string;
  tone: Tone;
  firstReply: string;
  resolve: string;
};

/**
 * Transcribed verbatim from `Update design.dc.html` → `const priRows`, in source order.
 *
 * READ-ONLY by design: the markup renders each row as a pill plus two text values, with no
 * input, select or editable control anywhere in the `wizIs2` body. Rendered as shown.
 */
export const SLA_TARGETS: SlaTarget[] = [
  { priority: "Urgent", tone: "error", firstReply: "15 minutes", resolve: "4 hours" },
  { priority: "High", tone: "warning", firstReply: "1 hour", resolve: "8 business hours" },
  { priority: "Normal", tone: "info", firstReply: "4 business hours", resolve: "2 business days" },
  { priority: "Low", tone: "neutral", firstReply: "1 business day", resolve: "5 business days" },
];

/** The design's `Invite as` options, in source order. */
export const INVITE_ROLES = ["Agent", "Manager", "Billing Admin"] as const;

/** The design's seeded step-3 value. */
export const SEED_INVITE_EMAILS = "priya@northwind.io, sam@northwind.io";

export const STEP_LABELS = ["Business hours", "First SLA policy", "Invite your team"] as const;
