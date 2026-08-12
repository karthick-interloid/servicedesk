import { BUSINESS_DAY_MINS } from "@/features/onboarding/lib/onboarding-data";

/**
 * SLA target durations — the prose the design shows, and the integer the schema stores.
 *
 * ─── WHY A PARSER EXISTS AT ALL ──────────────────────────────────────────────
 * `Update design.dc.html` → `scrSlaEditor` renders each target as a plain text `Input`
 * holding human prose: "15 minutes", "4 hours", "8 business hours", "2 business days".
 * There is NO number input and NO unit selector anywhere on that screen. But
 * `sla_policies.first_response_mins` / `.resolution_mins` are `integer`, so an editable
 * field has to round-trip prose → minutes.
 *
 * Onboarding step 2 hit the same prose but is READ-ONLY, so it could sidestep this: its
 * `SLA_TARGETS` simply states both forms side by side (`firstReply: "8 business hours"`,
 * `firstReplyMins: 480`) with a note that the prose "has no single reading". This module is
 * that same dual representation made bidirectional, using the SAME `BUSINESS_DAY_MINS`
 * constant so the two cannot drift.
 *
 * ⚠ THE GRAMMAR BELOW IS AUTHORED, NOT DESIGNED. The design specifies no input format,
 *   no validation and no error copy for these fields. Logged as a deviation in
 *   docs/SLA-DIFF.md.
 *
 * ⚠ "business" IS PARSED BUT NOT HONOURED DOWNSTREAM. `businessClock` is preserved so the
 *   prose round-trips unchanged, but the minutes it yields are plain durations — exactly
 *   the caveat `onboarding-data.ts` already records: until an SLA calculator reads
 *   `business_hours.schedule_json`, a 480-minute target elapses over 8 wall-clock hours
 *   including overnight, not 8 working ones. The schema has nowhere to store the
 *   distinction, which is one of the gaps this pass reports.
 */

export type DurationUnit = "minute" | "hour" | "day";

export type ParsedDuration = {
  /** The number the user typed. */
  value: number;
  unit: DurationUnit;
  /** True when the prose said "business hours" / "business days". */
  businessClock: boolean;
  /** What `first_response_mins` / `resolution_mins` would receive. */
  minutes: number;
};

/**
 * Accepted forms — deliberately narrow, matching only what the design actually displays:
 *
 *     <positive integer> [business] minute|minutes|hour|hours|day|days
 *
 * Case-insensitive, tolerant of extra internal whitespace. "business minutes" is rejected:
 * a minute is a minute on either clock, and the design never writes it.
 */
const PATTERN = /^\s*(\d+)\s+(business\s+)?(minutes?|hours?|days?)\s*$/i;

/** Minutes per unit. A plain day is a calendar day; a business day is `BUSINESS_DAY_MINS`. */
function unitMinutes(unit: DurationUnit, businessClock: boolean): number {
  if (unit === "minute") return 1;
  if (unit === "hour") return 60;
  return businessClock ? BUSINESS_DAY_MINS : 24 * 60;
}

/** `null` when the text is not a duration this grammar accepts. */
export function parseDuration(raw: string): ParsedDuration | null {
  const match = PATTERN.exec(raw);
  if (!match) return null;

  const value = Number.parseInt(match[1]!, 10);
  if (!Number.isFinite(value) || value <= 0) return null;

  const businessClock = Boolean(match[2]);
  const word = match[3]!.toLowerCase();
  const unit: DurationUnit = word.startsWith("minute")
    ? "minute"
    : word.startsWith("hour")
      ? "hour"
      : "day";

  // "business minutes" is not a thing the design writes, and reads as a mistake.
  if (unit === "minute" && businessClock) return null;

  return { value, unit, businessClock, minutes: value * unitMinutes(unit, businessClock) };
}

/** The inverse, so a parsed value renders back as the prose the design shows. */
export function formatDuration({ value, unit, businessClock }: Omit<ParsedDuration, "minutes">) {
  const plural = value === 1 ? unit : `${unit}s`;
  return businessClock ? `${value} business ${plural}` : `${value} ${plural}`;
}

/** The message shown when `parseDuration` returns null. Authored — see the header. */
export const DURATION_ERROR =
  "Use a number and a unit, like “15 minutes”, “4 hours” or “2 business days”.";
