import { describe, expect, it } from "vitest";

import { openTicketCount, ticketsForCompany } from "@/features/customers/lib/company-tickets";
import { MOCK_COMPANIES, findCompany } from "@/features/customers/lib/mock-companies";
import { MOCK_TICKETS } from "@/features/tickets/lib/mock-tickets";
import { SOLVED_STATUSES } from "@/features/tickets/types";

/**
 * These are the drift guards. The customers mock and the tickets mock are separate files,
 * and the whole point of the company→ticket join is that they describe ONE world. If some
 * future edit renames a person or repoints a ticket, these fail loudly instead of the
 * customer record quietly rendering an empty history.
 */
describe("company ↔ ticket reconciliation", () => {
  it("resolves every mock ticket to exactly one company", () => {
    for (const ticket of MOCK_TICKETS) {
      const owners = MOCK_COMPANIES.filter((c) =>
        c.contacts.some((p) => p.id === ticket.requester.id),
      );

      expect(
        owners.map((o) => o.name),
        `ticket #${ticket.number} (requester ${ticket.requester.id})`,
      ).toHaveLength(1);
    }
  });

  it("keeps each contact's company name in step with the ticket's requester company", () => {
    // The person records are shared, so `requester.company` (free text on the ticket mock)
    // must still name the company that claims them. This is the check that would catch a
    // rename on one side only.
    for (const company of MOCK_COMPANIES) {
      for (const contact of company.contacts) {
        const raised = MOCK_TICKETS.filter((t) => t.requester.id === contact.id);
        for (const ticket of raised) {
          expect(ticket.requester.company, `${contact.fullName} → ${company.name}`).toBe(
            company.name,
          );
        }
      }
    }
  });

  it("gives every company a non-empty, correctly-scoped ticket list", () => {
    for (const company of MOCK_COMPANIES) {
      const tickets = ticketsForCompany(company);
      const contactIds = new Set(company.contacts.map((c) => c.id));

      expect(tickets.length, company.name).toBeGreaterThan(0);
      expect(tickets.every((t) => contactIds.has(t.requester.id))).toBe(true);
    }
  });

  it("accounts for all 15 mock tickets across the nine companies, with no double-counting", () => {
    const seen = MOCK_COMPANIES.flatMap((c) => ticketsForCompany(c).map((t) => t.id));

    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(MOCK_TICKETS.length);
  });

  it("derives open counts that agree with the rows the record lists", () => {
    for (const company of MOCK_COMPANIES) {
      const listed = ticketsForCompany(company).filter((t) => !SOLVED_STATUSES.includes(t.status));

      expect(openTicketCount(company), company.name).toBe(listed.length);
    }
  });

  it("sorts a company's tickets by most recent activity", () => {
    const fernwood = findCompany("fernwood-group");
    expect(fernwood).toBeDefined();

    const updated = ticketsForCompany(fernwood!).map((t) => t.updatedAt);
    expect([...updated].sort((a, b) => b.localeCompare(a))).toEqual(updated);
  });
});

describe("findCompany", () => {
  it("resolves every id the list links to", () => {
    for (const company of MOCK_COMPANIES) {
      expect(findCompany(company.id)?.name).toBe(company.name);
    }
  });

  it("returns undefined for an unknown id, so the route can 404", () => {
    expect(findCompany("no-such-company")).toBeUndefined();
  });
});
