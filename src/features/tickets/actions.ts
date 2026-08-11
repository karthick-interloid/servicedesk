"use server";

import { revalidatePath } from "next/cache";

import {
  newTicketSchema,
  replySchema,
  updateTicketSchema,
} from "@/features/tickets/schemas/new-ticket";
import {
  importTickets,
  previewImport,
  type ImportPreview,
  type ImportResult,
} from "@/features/tickets/services/csv-import";
import {
  TicketError,
  addMessage,
  createTicket,
  updateTicket,
} from "@/features/tickets/services/ticket.service";
import type { CsvFieldName } from "@/features/tickets/lib/csv";
import type { TicketActionResult } from "@/features/tickets/types";

/**
 * Server Actions for the tickets feature — the boundary a client component is allowed to
 * call. `./services/*` stay server-only behind it.
 *
 * Every action here re-validates. A Server Action is a public POST endpoint reachable
 * without the UI, so the zod resolver on the form is a convenience and this is the real
 * check; the same reasoning `features/auth/actions.ts` documents.
 */

/** Turn any thrown failure into the envelope, without leaking configuration detail. */
function toFailure<T>(error: unknown, fallback: string, context: string): TicketActionResult<T> {
  if (error instanceof TicketError) {
    return { success: false, code: error.code, message: error.message };
  }

  console.error(`[tickets] ${context} failed`, error);

  return { success: false, code: "unknown", message: fallback };
}

/**
 * Create a ticket, its opening message and its SLA clock.
 *
 * Revalidates `/tickets` rather than trusting the client router: the queue is a Server
 * Component read, so without this the new ticket is absent from the cached RSC payload the
 * redirect lands on, and the user watches their own ticket fail to appear.
 */
export async function createTicketAction(
  values: unknown,
): Promise<TicketActionResult<{ id: string; number: number }>> {
  const parsed = newTicketSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "validation",
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const ticket = await createTicket(parsed.data);

    revalidatePath("/tickets");

    return { success: true, data: ticket };
  } catch (error) {
    return toFailure(
      error,
      "We couldn't create that ticket. Try again in a moment.",
      "createTicketAction",
    );
  }
}

/** Post a public reply or an internal note on a ticket. */
export async function addMessageAction(
  values: unknown,
): Promise<TicketActionResult<{ id: string }>> {
  const parsed = replySchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "validation",
      message: "Write a reply before sending.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const message = await addMessage(parsed.data);

    // The thread and the queue both move: posting stamps `tickets.updated_at` through the
    // `touch_ticket_on_message` trigger, which is what the queue sorts on.
    revalidatePath(`/tickets/${parsed.data.ticketId}`);
    revalidatePath("/tickets");

    return { success: true, data: message };
  } catch (error) {
    return toFailure(
      error,
      "We couldn't post that reply. Try again in a moment.",
      "addMessageAction",
    );
  }
}

/** Change status, priority or assignee from the detail page's properties panel. */
export async function updateTicketAction(values: unknown): Promise<TicketActionResult<null>> {
  const parsed = updateTicketSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "validation",
      message: "That isn't a value this ticket can take.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateTicket(parsed.data);

    revalidatePath(`/tickets/${parsed.data.ticketId}`);
    revalidatePath("/tickets");

    return { success: true, data: null };
  } catch (error) {
    return toFailure(
      error,
      "We couldn't save that change. Try again in a moment.",
      "updateTicketAction",
    );
  }
}

/**
 * Report what a CSV would do, writing nothing.
 *
 * Separate from `importTicketsAction` so the review step the design draws is a real dry run
 * over the real bytes, not a client-side guess — the counts the user approves are produced
 * by the same code that then performs the import.
 */
export async function previewImportAction(
  csv: unknown,
  mapping?: unknown,
): Promise<TicketActionResult<ImportPreview>> {
  if (typeof csv !== "string" || csv.trim() === "") {
    return { success: false, code: "validation", message: "Choose a CSV file first." };
  }

  try {
    return { success: true, data: await previewImport(csv, toMapping(mapping)) };
  } catch (error) {
    return toFailure(error, "We couldn't read that file.", "previewImportAction");
  }
}

/** Perform the import. Re-parses the file server-side; see `importTickets`. */
export async function importTicketsAction(
  csv: unknown,
  mapping?: unknown,
): Promise<TicketActionResult<ImportResult>> {
  if (typeof csv !== "string" || csv.trim() === "") {
    return { success: false, code: "validation", message: "Choose a CSV file first." };
  }

  try {
    const result = await importTickets(csv, toMapping(mapping));

    revalidatePath("/tickets");

    return { success: true, data: result };
  } catch (error) {
    return toFailure(error, "We couldn't import that file.", "importTicketsAction");
  }
}

/**
 * Narrow an untrusted mapping off the wire. Anything that isn't an array of known field
 * names or nulls is discarded entirely rather than partially trusted — the service falls
 * back to guessing from the headers, which is a safe default.
 */
const FIELD_NAMES = new Set<string>([
  "legacyId",
  "subject",
  "requesterEmail",
  "company",
  "priority",
  "status",
  "createdAt",
]);

function toMapping(value: unknown): (CsvFieldName | null)[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const mapping = value.map((entry) =>
    typeof entry === "string" && FIELD_NAMES.has(entry) ? (entry as CsvFieldName) : null,
  );

  return mapping;
}
