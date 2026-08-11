import { z } from "zod";

/**
 * What `/tickets/new` submits.
 *
 * Mirrors `public.tickets`' own constraints rather than inventing UI-only rules: `subject`
 * and `description` are NOT NULL there, `priority` is `public.ticket_priority`, and
 * `requesterCustomerId` is the FK that makes the row insertable at all.
 *
 * Re-run server-side by `createTicketAction` — a Server Action is a public endpoint, so
 * this is the real check and the resolver on the form is the convenience.
 */
export const newTicketSchema = z.object({
  /**
   * `customers.id`, not an email. The current design draws a "Select a customer" picker,
   * which is what this is — an earlier revision drew a free-text address, and TICKETS-DIFF
   * D1 recorded the deviation. The constraint that forced it still holds either way: a
   * ticket cannot be inserted without a real FK, and `customers_insert` is restricted to
   * tenant_admin and manager, so an agent typing an unknown address could not have one
   * created for them anyway.
   */
  requesterCustomerId: z.uuid("Pick who this ticket is for."),

  subject: z
    .string()
    .trim()
    .min(1, "Add a subject so the customer can recognise this.")
    .max(200, "Keep the subject under 200 characters"),

  /**
   * Becomes both `tickets.description` and the ticket's first `ticket_messages` row. The
   * column is NOT NULL, so the design's "Description" field is required, not optional.
   */
  description: z
    .string()
    .trim()
    .min(1, "Describe what the customer reported")
    .max(20_000, "That message is too long to store"),

  priority: z.enum(["urgent", "high", "normal", "low"]),

  /**
   * `users.id`, or null.
   *
   * The New ticket sheet no longer draws an assignee picker — the design took it out, and
   * an agent assigns from the queue or the ticket itself — so in practice this arrives as
   * null and the row is created unassigned. It stays in the schema because `createTicket`
   * is not the sheet's private function: the CSV importer and any later caller still need
   * a way to say who owns the ticket at insert time.
   */
  assigneeUserId: z.uuid().nullable(),
});

export type NewTicketValues = z.infer<typeof newTicketSchema>;

/** What the detail page's composer submits. */
export const replySchema = z.object({
  ticketId: z.uuid(),

  body: z
    .string()
    .trim()
    .min(1, "Write a reply before sending")
    .max(20_000, "That message is too long to store"),

  /**
   * `public.message_visibility`. An internal note is invisible to the customer portal —
   * `ticket_messages_select` filters customers to `visibility = 'public'` — so this is a
   * disclosure decision, not styling, and it is never inferred.
   */
  visibility: z.enum(["public", "internal"]),
});

export type ReplyValues = z.infer<typeof replySchema>;

/** Inline edits from the detail page's properties panel. */
export const updateTicketSchema = z.object({
  ticketId: z.uuid(),
  status: z.enum(["new", "open", "pending", "on_hold", "resolved", "closed"]).optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  /** `null` clears the assignment; `undefined` leaves it alone. */
  assigneeUserId: z.uuid().nullable().optional(),
});

export type UpdateTicketValues = z.infer<typeof updateTicketSchema>;
