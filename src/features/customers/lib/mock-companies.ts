/**
 * ███  M O C K   D A T A  —  R E P L A C E   A T   W I R I N G  ███
 *
 * Nothing here touches the network. See `../types.ts` for the blunt version of why this
 * module cannot simply be swapped for a query: the design's entity is a COMPANY and the
 * schema has no companies table. Six fields below are marked ⚠ there.
 *
 * ─── HOW THIS CONNECTS TO THE TICKET MOCK ────────────────────────────────────
 * Each company's `contacts` are REFERENCES INTO `mock-tickets.ts`'s exported `REQUESTERS`
 * object — the very same person records the mock tickets point at. They are not re-typed
 * copies, so a person's `id` cannot drift away from the tickets that carry it.
 *
 * The company→ticket join is therefore by PERSON ID, never by company name:
 *
 *     company.contacts[].id  ===  ticket.requester.id
 *
 * which is exactly the shape of the real query once `customers.company_id` exists
 * (`tickets → requester_customer_id → customers.company_id`). `lib/company-tickets.ts`
 * performs it, and `test/features/customers/company-tickets.test.ts` asserts that every
 * one of the 15 mock tickets resolves to exactly one company — so the two datasets cannot
 * silently drift apart.
 *
 * Coverage:
 *   plan     — Enterprise ×1 · Business ×3 · Standard ×5
 *   contacts — 1 contact ×6 · 2 contacts ×3
 *   tickets  — every company has ≥1 (see the note on the no-tickets branch below)
 *
 * ⚠ The design's `custNoTickets` branch ("No tickets from this company yet") is BUILT in
 *   `customer-record.tsx` but is unreachable with this 9-company set, because all nine are
 *   derived from companies that already raise mock tickets. Adding one ticket-less company
 *   would exercise it.
 *
 * The FIRST SIX companies are the design's own, in its order, with its exact domain, plan,
 * CSAT and account owner — so the 1440 list screenshot is directly comparable to
 * `design-reference/customers--light.png`. The last three are the remaining companies that
 * already appear in the ticket mock; their domain/plan/CSAT/owner are authored.
 */

import { REQUESTERS } from "@/features/tickets/lib/mock-tickets";

import type { CompanyContact, CustomerCompany } from "../types";

/**
 * A contact built from the shared requester record. `email` is NOT on `REQUESTERS`
 * (the queue never renders one), so it is composed here from the person's first name and
 * the company domain — which reproduces the design's own `dana@meridianlabs.com` exactly.
 */
const contact = (
  person: { id: string; fullName: string },
  domain: string,
  role: CompanyContact["role"],
): CompanyContact => ({
  id: person.id,
  fullName: person.fullName,
  // NFD + strip combining marks so "Tomás" becomes "tomas", not "tomás".
  email: `${person.fullName
    .split(" ")[0]!
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()}@${domain}`,
  role,
});

export const MOCK_COMPANIES: CustomerCompany[] = [
  /* ---- The six the design draws, in its order ---------------------------- */
  {
    id: "meridian-labs",
    name: "Meridian Labs",
    domain: "meridianlabs.com",
    plan: "Enterprise",
    csat: 4.8,
    accountOwner: "Priya Raman",
    customerSince: "2024-03-01",
    lifetimeTickets: 88,
    contacts: [
      contact(REQUESTERS.dana, "meridianlabs.com", "Primary contact"),
      // Owen has no tickets — the design draws him, and a billing contact who never
      // raises anything is realistic. He is the one contact NOT in the ticket mock.
      {
        id: "c-owen-pryce",
        fullName: "Owen Pryce",
        email: "owen@meridianlabs.com",
        role: "Billing",
      },
    ],
  },
  {
    id: "corely",
    name: "Corely",
    domain: "corely.io",
    plan: "Business",
    csat: 4.4,
    accountOwner: "Sam Okafor",
    customerSince: "2024-07-01",
    lifetimeTickets: 41,
    contacts: [contact(REQUESTERS.marcus, "corely.io", "Primary contact")],
  },
  {
    id: "skyline-freight",
    name: "Skyline Freight",
    domain: "skylinefreight.com",
    plan: "Business",
    csat: 4.1,
    accountOwner: "Priya Raman",
    customerSince: "2023-11-01",
    lifetimeTickets: 63,
    contacts: [contact(REQUESTERS.tomas, "skylinefreight.com", "Primary contact")],
  },
  {
    id: "northgate-retail",
    name: "Northgate Retail",
    domain: "northgate.co.uk",
    plan: "Standard",
    csat: 4.6,
    accountOwner: "Ava Lindqvist",
    customerSince: "2025-02-01",
    lifetimeTickets: 12,
    contacts: [contact(REQUESTERS.lena, "northgate.co.uk", "Primary contact")],
  },
  {
    id: "blume-studio",
    name: "Blume Studio",
    domain: "blume.studio",
    plan: "Standard",
    csat: 5.0,
    accountOwner: "Ava Lindqvist",
    customerSince: "2025-05-01",
    lifetimeTickets: 7,
    contacts: [contact(REQUESTERS.ravi, "blume.studio", "Primary contact")],
  },
  {
    id: "fernwood-group",
    name: "Fernwood Group",
    domain: "fernwood.group",
    plan: "Standard",
    csat: 3.9,
    accountOwner: "Sam Okafor",
    customerSince: "2024-09-01",
    lifetimeTickets: 26,
    contacts: [
      contact(REQUESTERS.grace, "fernwood.group", "Primary contact"),
      contact(REQUESTERS.chloe, "fernwood.group", "Billing"),
    ],
  },

  /* ---- The remaining ticket-mock companies. Attributes authored. ---------- */
  {
    id: "halcyon-bank",
    name: "Halcyon Bank",
    domain: "halcyonbank.com",
    plan: "Business",
    csat: 4.2,
    accountOwner: "Priya Raman",
    customerSince: "2023-06-01",
    lifetimeTickets: 74,
    contacts: [
      contact(REQUESTERS.aisha, "halcyonbank.com", "Primary contact"),
      contact(REQUESTERS.tom, "halcyonbank.com", "Billing"),
    ],
  },
  {
    id: "kestrel-media",
    name: "Kestrel Media",
    domain: "kestrelmedia.com",
    plan: "Standard",
    csat: 4.5,
    accountOwner: "Sam Okafor",
    customerSince: "2025-01-01",
    lifetimeTickets: 19,
    contacts: [contact(REQUESTERS.ellie, "kestrelmedia.com", "Primary contact")],
  },
  {
    id: "rosewood-health",
    name: "Rosewood Health",
    domain: "rosewoodhealth.org",
    plan: "Standard",
    csat: 4.7,
    accountOwner: "Ava Lindqvist",
    customerSince: "2024-12-01",
    lifetimeTickets: 15,
    contacts: [contact(REQUESTERS.ian, "rosewoodhealth.org", "Primary contact")],
  },
];

/** Stable-id lookup for `/customers/[id]`. Returns undefined for an unknown segment. */
export function findCompany(id: string): CustomerCompany | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id);
}
