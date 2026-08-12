import type { Tone } from "@/lib/badge-tones";

/* ---------------------------------------------------------------------------
   ⚠ READ THIS BEFORE WIRING — THE SCHEMA DOES NOT MODEL THIS SCREEN'S ENTITY.

   `Update design.dc.html` draws /customers and /customers/[id] as COMPANY screens:
   the list rows are companies, and the record is a company with contacts nested inside
   it. The database has no companies table. `public.customers` models PEOPLE
   (`full_name`, `email`, `portal_user_id`, `phone`) and carries the company only as
   `customers.company`, free text — whose own schema comment predicts this exact moment:

     "Promote it to its own table when something needs one company to be renamed across
      every customer at once, or to carry its own fields (domain, plan, account manager)."

   That promotion is now needed. Six fields this UI renders have NO column anywhere, and
   the row entity itself has no table and therefore no id for `/customers/[id]` to resolve
   against. Each is marked ⚠ NO COLUMN below. Nothing here is wired; the wiring slice must
   land a `companies` table (plus `customers.company_id`) first.

   Two fields ARE honestly derivable today and are derived, not stored — see
   `lib/company-tickets.ts`.
   --------------------------------------------------------------------------- */

/** The three plan tiers the design draws. No wider set is shown, so this is closed. */
export type CompanyPlan = "Enterprise" | "Business" | "Standard";

/**
 * The two contact roles the design draws — and only these two. The design shows
 * "Primary contact" and "Billing" and nothing else, so no third role is invented.
 *
 * ⚠ NO COLUMN. `public.customers` has no role/contact_type field.
 */
export type CompanyContactRole = "Primary contact" | "Billing";

/** A person attached to a company. This half maps cleanly onto `public.customers`. */
export type CompanyContact = {
  /** `customers.id`. Identical to the `requester.id` on the tickets they raised. */
  id: string;
  /** `customers.full_name` */
  fullName: string;
  /** `customers.email` */
  email: string;
  /** ⚠ NO COLUMN — see `CompanyContactRole`. */
  role: CompanyContactRole;
};

/**
 * One row of the customers list, and the subject of the customer record.
 *
 * ```sql
 * -- WHAT THE WIRING SLICE NEEDS, none of which exists yet:
 * create table public.companies (
 *   id uuid primary key default gen_random_uuid(),
 *   tenant_id uuid not null references public.tenants(id) on delete cascade,
 *   name text not null,
 *   domain text,                                    -- ⚠ new
 *   plan text,                                      -- ⚠ new, NOT public.plans
 *   account_owner_user_id uuid references public.users(id),   -- ⚠ new
 *   created_at timestamptz not null default now(),
 *   unique (tenant_id, name)
 * );
 * alter table public.customers add column company_id uuid references public.companies(id);
 * -- csat has no home at all: no ratings/survey table exists.
 * ```
 */
export type CustomerCompany = {
  /**
   * ⚠ NO COLUMN. The stable id `/customers/[id]` resolves against. Today it is a slug
   * invented by the mock; a real one is `companies.id`.
   */
  id: string;
  /** `customers.company` today (free text, duplicated across every person). */
  name: string;
  /** ⚠ NO COLUMN. Rendered as the caption under the name, e.g. `meridianlabs.com`. */
  domain: string;
  /**
   * ⚠ NO COLUMN. NOT `public.plans` — that table is the *tenant's own* billing
   * subscription, and nothing links a customer to it. This is a per-company service tier.
   */
  plan: CompanyPlan;
  /**
   * ⚠ NO COLUMN, and no table to put it in. There is no CSAT/ratings/survey table in the
   * schema at all. Rendered as `4.8` in the list and `4.8 / 5` on the record.
   */
  csat: number;
  /** ⚠ NO COLUMN. An agent's display name; would be `companies.account_owner_user_id`. */
  accountOwner: string;
  /**
   * ⚠ PARTIALLY DERIVABLE. Rendered as "Customer since Mar 2024". Could be
   * `min(customers.created_at)` over the company's people once `company_id` exists, but
   * there is no company-level `created_at` today. Stored here as an ISO date.
   */
  customerSince: string;
  /**
   * ⚠ MOCK-ONLY, deliberately NOT derived. All-time ticket volume. The shared mock
   * (`mock-tickets.ts`) is a *recent queue window* of 15 tickets, not a full history, so
   * deriving this would report "1" for a company that has plainly been around for years.
   * `openTickets` IS derived, because it must agree with the Recent-tickets list rendered
   * directly beneath it. See `lib/company-tickets.ts`.
   */
  lifetimeTickets: number;
  /** The people. Maps onto `public.customers` rows via the future `company_id`. */
  contacts: CompanyContact[];
};

/** Plan → badge tone, measured off the capture's pills. Plans carry NO dot (see below). */
export const PLAN_TONE: Record<CompanyPlan, Tone> = {
  /* #DCFCE7 / #166534 — the badge-only brand pair. */
  Enterprise: "brand",
  /* #EEF2FF / #3730A3 */
  Business: "info",
  /* #F1F5F9 / #334155 */
  Standard: "neutral",
};

/** Which of the two designed list states to render. Demo-only — see `page.tsx`. */
export type CustomersState = "default" | "empty";
