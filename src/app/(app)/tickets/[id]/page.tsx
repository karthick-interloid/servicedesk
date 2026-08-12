import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TicketDetail } from "@/features/tickets/components/ticket-detail";
import {
  getTicket,
  listAssignableUsers,
  serverNow,
} from "@/features/tickets/services/ticket.service";

export const metadata: Metadata = {
  // The subject would be a better title, but generating it costs the same query twice —
  // `generateMetadata` runs in its own pass. Revisit when the read is cached.
  title: "Ticket",
  robots: { index: false, follow: false },
};

/**
 * One ticket.
 *
 * `getTicket` returns null both for "no such ticket" and for "not yours" — RLS makes those
 * indistinguishable on purpose, and rendering the same 404 for each is what stops a ticket
 * id from another tenant confirming that it exists.
 */
export default async function TicketDetailPage(props: PageProps<"/tickets/[id]">) {
  const { id } = await props.params;

  const [ticket, assignees, now] = await Promise.all([
    getTicket(id),
    listAssignableUsers(),
    serverNow(),
  ]);

  if (!ticket) {
    notFound();
  }

  return <TicketDetail ticket={ticket} assignees={assignees} now={now} />;
}
