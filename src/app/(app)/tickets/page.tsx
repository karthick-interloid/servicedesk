import type { Metadata } from "next";

import { TicketQueue } from "@/features/tickets/components/ticket-queue";
import { listCustomers, loadQueue, serverNow } from "@/features/tickets/services/ticket.service";
import type { QueueState } from "@/features/tickets/types";

export const metadata: Metadata = {
  title: "Tickets",
  alternates: {
    canonical: "/tickets",
  },
};

const STATES: readonly QueueState[] = ["default", "loading", "empty", "error"];

/**
 * The queue.
 *
 * A Server Component so the rows are fetched under the caller's own token — RLS
 * (`supabase/schemas/policies/09_tickets.sql`) is what scopes them to the tenant, and doing
 * the read here keeps the Supabase client out of the client bundle entirely.
 *
 * Customers are fetched alongside the rows because the New ticket sheet lives inside the
 * queue rather than on its own route; its requester picker would otherwise cost a round
 * trip on first open.
 *
 * `?state=loading|empty|error` still forces the three non-default states so each stays
 * reviewable without arranging data to produce it. `error` is the one that earns its keep —
 * the alternative is breaking the database to look at the error card.
 */
export default async function TicketsPage(props: PageProps<"/tickets">) {
  const { state } = await props.searchParams;
  const requested = Array.isArray(state) ? state[0] : state;
  const demoState = STATES.includes(requested as QueueState)
    ? (requested as QueueState)
    : "default";

  // Skip the queries a forced state would throw away — and let `?state=error` render the
  // error card without the fetch having to actually fail.
  if (demoState !== "default") {
    return (
      <TicketQueue
        tickets={[]}
        currentUserId={null}
        customers={[]}
        now={await serverNow()}
        state={demoState}
      />
    );
  }

  /*
   * The rows are the page; the customer list only furnishes the New ticket sheet. So
   * `loadQueue` is allowed to throw into the error boundary — that failure IS the designed
   * error state — while a picker that cannot load degrades to an empty list instead of
   * taking the whole queue down with it. An agent who can read their queue but not the
   * customer list should still see their queue.
   */
  const [{ tickets, currentUserId, now }, customers] = await Promise.all([
    loadQueue(),
    listCustomers().catch(() => []),
  ]);

  return (
    <TicketQueue tickets={tickets} currentUserId={currentUserId} customers={customers} now={now} />
  );
}
