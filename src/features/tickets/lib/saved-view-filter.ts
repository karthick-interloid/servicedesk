import { formatSla } from "./queue-format";

import type { QueueTicket, SavedViewFilter } from "../types";

/**
 * Does a queue ticket fall inside a saved view's filter?
 *
 * Pure, and deliberately built on the SAME `formatSla` the queue's SLA column uses, so a
 * view that says "5 tickets" and the queue it opens can never disagree about which five.
 * Re-deriving the SLA state here with its own thresholds is exactly how those two drift.
 *
 * `assignee: "me"` is resolved against `currentUserId` at read time rather than stored, so
 * a SHARED "Assigned to me" view means something different to each teammate who opens it —
 * which is the semantics `SavedViewFilter` documents.
 *
 * An absent key matches everything; an empty array matches nothing, because a filter that
 * lists no acceptable statuses has excluded them all. That distinction matters: `{}` is the
 * "All tickets" view.
 */
export function matchesSavedViewFilter(
  ticket: QueueTicket,
  filter: SavedViewFilter,
  { currentUserId, now }: { currentUserId: string | null; now: number },
): boolean {
  if (filter.status && !filter.status.includes(ticket.status)) return false;
  if (filter.priority && !filter.priority.includes(ticket.priority)) return false;

  if (filter.assignee !== undefined) {
    if (filter.assignee === "unassigned") {
      if (ticket.assignee !== null) return false;
    } else if (filter.assignee === "me") {
      if (!currentUserId || ticket.assignee?.id !== currentUserId) return false;
    } else if (ticket.assignee?.id !== filter.assignee.userId) {
      return false;
    }
  }

  if (filter.sla) {
    const sla = formatSla(ticket.slaEvent, now, ticket.createdAt);
    // A ticket no SLA policy ever applied to has no state to match against, so an
    // SLA-filtered view excludes it rather than counting it under some default.
    if (!sla || !filter.sla.includes(sla.state)) return false;
  }

  return true;
}

/** How many of `tickets` a view's filter selects. */
export function countMatching(
  tickets: QueueTicket[],
  filter: SavedViewFilter,
  context: { currentUserId: string | null; now: number },
): number {
  return tickets.reduce(
    (total, ticket) => (matchesSavedViewFilter(ticket, filter, context) ? total + 1 : total),
    0,
  );
}
