import type { Tone } from "@/lib/badge-tones";
import type { TicketPriority } from "@/features/tickets/types";

/* ---------------------------------------------------------------------------
   ⚠ THE SCHEMA CANNOT STORE THIS SCREEN AS DRAWN. Three separate problems:

   1. WRONG GRAIN, AND IT IS ALREADY FULL.
      The design's ONE policy carries FOUR priority targets. `public.sla_policies` is one
      row PER priority — a single `priority_scope`, a single `first_response_mins`, a
      single `resolution_mins` — under `unique (tenant_id, priority_scope)`. So one designed
      policy is four rows, and the constraint caps a tenant at four rows TOTAL. The design
      shows THREE policies: twelve rows into four slots. Not merely unmodelled — impossible.

      Worse, this is not hypothetical. `features/auth/services/register.service.ts`
      already inserts exactly those four rows at signup ("Default SLA — Urgent" … "— Low",
      `is_default: true`), which exhausts the constraint on day one. Wired against today's
      schema this list would show four rows with those names, and "New policy" could never
      succeed.

   2. FOUR EDITED FIELDS HAVE NO COLUMN — `status`, `appliesTo`, `notifyBeforeBreach`,
      `escalateOnBreach`. Each is marked ⚠ below.

   3. THE DURATIONS ARE PROSE. See `lib/duration.ts`.

   Conversely `sla_policies.is_default` — which the schema HAS — is never drawn. The design
   uses a three-way `status` instead. The two are swapped.

   What the wiring slice needs before any of this can be saved:

   ```sql
   alter table public.sla_policies drop constraint uq_sla_priority;
   alter table public.sla_policies
     add column status text not null default 'active',   -- ⚠ new: active|paused|draft
     add column applies_to text;                         -- ⚠ new: customer-segment scope
   -- the per-priority targets move to their own table, one row per (policy, priority):
   create table public.sla_policy_targets (
     id uuid primary key default gen_random_uuid(),
     policy_id uuid not null references public.sla_policies(id) on delete cascade,
     priority_scope ticket_priority not null,
     first_response_mins integer not null,
     resolution_mins integer not null,
     -- ⚠ nothing today records whether a target runs on the business-hours clock:
     first_response_business boolean not null default false,
     resolution_business boolean not null default false,
     unique (policy_id, priority_scope)
   );
   -- notify_before_breach / escalate_on_breach also need a home.
   ```
   --------------------------------------------------------------------------- */

/** The three the design's Status select offers, in its order. ⚠ NO COLUMN. */
export type SlaStatus = "Active" | "Paused" | "Draft";

/** The three the design's "Applies to" select offers, in its order. ⚠ NO COLUMN. */
export type SlaAppliesTo =
  "Business & Enterprise customers" | "All customers" | "Urgent tickets only";

/** Status → badge tone. The design draws these WITH a leading dot (they answer "what state"). */
export const SLA_STATUS_TONE: Record<SlaStatus, Tone> = {
  /* #E4F6EC / #0B7A3B */
  Active: "success",
  /* #FFFBEB / #B45309 */
  Paused: "warning",
  Draft: "neutral",
};

/**
 * One row of the "Targets by priority" section.
 *
 * The two durations are held as the PROSE the design shows, because that is literally what
 * its text inputs contain. `lib/duration.ts` converts to the integer minutes the schema
 * wants; `priorityTone`/`label` come straight from onboarding's `SLA_TARGETS` so the pill
 * treatment is the one already established, not a third invention.
 */
export type SlaTargetRow = {
  /** `sla_policy_targets.priority_scope` — the `public.ticket_priority` enum value. */
  scope: TicketPriority;
  /** Display label: "Urgent" · "High" · "Normal" · "Low". */
  label: string;
  /** The badge tone onboarding already assigns this priority. */
  tone: Tone;
  /** Prose, e.g. "15 minutes". → `first_response_mins` via `parseDuration`. */
  firstResponse: string;
  /** Prose, e.g. "4 hours". → `resolution_mins` via `parseDuration`. */
  resolution: string;
};

/**
 * A policy as the DESIGN models it: a named container with four priority targets inside.
 *
 * ```sql
 * -- what a real read WOULD look like, after the migration sketched above:
 * select p.id, p.name, p.status, p.applies_to, p.business_hours_id,
 *        t.priority_scope, t.first_response_mins, t.resolution_mins
 *   from sla_policies p
 *   join sla_policy_targets t on t.policy_id = p.id
 *  where p.tenant_id = current_tenant_id()
 * ```
 */
export type SlaPolicy = {
  /** `sla_policies.id` */
  id: string;
  /** `sla_policies.name` */
  name: string;
  /** ⚠ NO COLUMN. */
  status: SlaStatus;
  /**
   * ⚠ NO COLUMN. A customer-segment scope — NOT `priority_scope`, which is a
   * `ticket_priority` enum and a different concept entirely. Rendered as the caption under
   * the policy name in the list, and as a select in the editor.
   */
  appliesTo: SlaAppliesTo;
  /** `sla_policies.business_hours_id` → `public.business_hours`. */
  businessHoursId: string;
  /** ⚠ Needs `sla_policy_targets`; today's table holds one priority per row. */
  targets: SlaTargetRow[];
  /** ⚠ NO COLUMN. Editor switch, on by default in the design. */
  notifyBeforeBreach: boolean;
  /** ⚠ NO COLUMN. Editor switch. */
  escalateOnBreach: boolean;
  /**
   * DERIVED — `count(*)` over `tickets` where `sla_policy_id = p.id`. Rendered as the
   * "Applied to" column ("412 tickets"). Not a column of `sla_policies`.
   */
  appliedTicketCount: number;
  /** `sla_policies.created_at` — the list order. */
  createdAt: string;
};

/**
 * A `public.business_hours` row. Every field here DOES exist — this is the one part of the
 * editor the schema already supports.
 */
export type BusinessHours = {
  /** `business_hours.id` */
  id: string;
  /** `business_hours.name` — the label the editor's select shows. */
  name: string;
  /** Join on `business_hours.timezone_id` → `timezones`. */
  timezoneLabel: string;
  /** `business_hours.schedule_json` — which days are working days. */
  days: string[];
  /** `business_hours.schedule_json` */
  dayStart: string;
  /** `business_hours.schedule_json` */
  dayEnd: string;
  /** `business_hours.holidays_json` */
  holidays: string[];
};

/** Which of the two designed list states to render. Demo-only — see `page.tsx`. */
export type SlaListState = "default" | "empty";
