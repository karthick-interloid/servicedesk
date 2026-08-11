/**
 * The company → ticket join.
 *
 * This is the module that stops the customers mock and the tickets mock from being two
 * disconnected datasets. It resolves a company's tickets through PERSON IDS — the same
 * `customers.id` values that `MOCK_TICKETS[].requester.id` carries — which is exactly the
 * path the real query will take once `customers.company_id` exists:
 *
 *     tickets.requester_customer_id → customers.id → customers.company_id → companies.id
 *
 * Nothing here matches on a company *name*. The design's own prototype does
 * (`ALLT.filter((x) => x.co === custRec.name)`), but name-matching silently returns an
 * empty list the moment a string is edited on one side, which is precisely the "second
 * disconnected dataset" failure this needs to avoid.
 *
 * Everything is a pure function over the two mock modules — no fetch, no client, no cache.
 */

import { MOCK_TICKETS } from "@/features/tickets/lib/mock-tickets";
import { SOLVED_STATUSES, type QueueTicket } from "@/features/tickets/types";

import type { CustomerCompany } from "../types";

/** `resolved` and `closed` are terminal; everything else counts as open. */
const isOpen = (t: QueueTicket) => !SOLVED_STATUSES.includes(t.status);

/**
 * Every mock ticket raised by one of the company's contacts, newest activity first —
 * the same ordering the queue defaults to.
 */
export function ticketsForCompany(company: CustomerCompany): QueueTicket[] {
  const contactIds = new Set(company.contacts.map((c) => c.id));

  return MOCK_TICKETS.filter((t) => contactIds.has(t.requester.id)).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

/**
 * DERIVED, not stored: how many of the company's tickets are still open.
 *
 * This is derived rather than mocked because the record renders it directly above the
 * Recent-tickets list — a hard-coded number that disagreed with the rows underneath it
 * would be visibly wrong. (`lifetimeTickets` is deliberately NOT derived; see its note in
 * `../types.ts`.)
 */
export function openTicketCount(company: CustomerCompany): number {
  return ticketsForCompany(company).filter(isOpen).length;
}
