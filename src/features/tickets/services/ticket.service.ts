import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  attachmentExtension,
  attachmentMime,
  rejectAttachment,
} from "@/features/tickets/lib/attachments";
import type {
  NewTicketValues,
  ReplyValues,
  UpdateTicketValues,
} from "@/features/tickets/schemas/new-ticket";
import type {
  QueueAssignee,
  QueueRequester,
  QueueTicket,
  TicketDetail,
  TicketFailureCode,
  TicketMessage,
} from "@/features/tickets/types";

/**
 * Ticket service — the only module that talks to Supabase for tickets.
 *
 * Same shape as `features/auth/services/auth.service.ts`: callers are Server Actions and
 * Server Components, it never imports React, and it returns domain values or throws
 * `TicketError`.
 *
 * ⚠ SERVER ONLY. This reaches `next/headers` through the Supabase client, so importing it
 * from a `"use client"` file breaks the build for the whole route group — that is exactly
 * what `identity.ts` did to the app shell. The `server-only` package would turn that into a
 * named error instead of a confusing module-graph one, but it is not a dependency here and
 * this slice adds none; the boundary is held by convention and by actions.ts being the only
 * thing client components import.
 *
 * Every call uses the anon key plus the caller's own access token, so
 * `supabase/schemas/policies/09_tickets.sql` and its siblings are what actually scope the
 * data. There is no tenant filter in any query below and there should not be — a
 * `.eq("tenant_id", …)` here would read as the security boundary while RLS quietly did the
 * real work, and the two would drift.
 */

export class TicketError extends Error {
  readonly status: number;
  readonly code: TicketFailureCode;

  constructor(message: string, { status = 400, code = "unknown" as TicketFailureCode } = {}) {
    super(message);
    this.name = "TicketError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Postgres error codes that mean something the user can act on, rather than a bug.
 * `42501` is RLS refusing the row; `23505` is `uq_ticket_number` or `uq_ticket_tag`.
 */
function toFailureCode(pgCode: string | undefined): TicketFailureCode {
  switch (pgCode) {
    case "42501":
      return "forbidden";
    case "23505":
      return "conflict";
    case "23503":
      return "not_found";
    default:
      return "unknown";
  }
}

/** The shape of a PostgREST error, which supabase-js returns rather than throws. */
type PostgrestFailure = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * Build the user-facing error, and say what actually went wrong on the server console.
 *
 * The message the user sees is deliberately vague — it must not leak schema or connection
 * detail. But swallowing the Postgres error entirely made a missing column surface as
 * "We couldn't load your queue." with no clue which column, which is a bad half-hour for
 * whoever is on call. `42703 column customers_1.company does not exist` names itself.
 */
function fail(userMessage: string, error: PostgrestFailure | null | undefined, status = 500) {
  if (error) {
    console.error(
      `[tickets] ${userMessage} — ${error.code ?? "?"} ${error.message ?? ""}`.trim(),
      error.details ? `\n  details: ${error.details}` : "",
      error.hint ? `\n  hint: ${error.hint}` : "",
    );
  }

  return new TicketError(userMessage, { status, code: toFailureCode(error?.code) });
}

/* --------------------------------------------------------------------------
   Selects. Kept as constants because the queue row and the detail header must
   agree on the shape `QueueTicket` promises — two hand-written copies of this
   drift the moment a column is added.
   -------------------------------------------------------------------------- */

/**
 * The embedded resources are disambiguated by constraint name. `tickets` reaches `customers`
 * and `users` through exactly one FK each today, so the bare table name would resolve — but
 * it stops resolving the moment a second FK is added (a `closed_by_user_id`, say), and the
 * error that produces is a runtime PostgREST message, not a compile failure.
 */
const QUEUE_SELECT = `
  id, number, subject, status, priority, sla_policy_id,
  first_response_at, resolved_at, closed_at, created_at, updated_at,
  requester:customers!tickets_requester_customer_id_fkey ( id, full_name, company ),
  assignee:users!tickets_assignee_user_id_fkey ( id, full_name, avatar_url ),
  sla_events ( type, status, due_at, completed_at, breached_at )
` as const;

/** PostgREST's row shape for the select above, before it is flattened to `QueueTicket`. */
type TicketRow = {
  id: string;
  number: number;
  subject: string;
  status: QueueTicket["status"];
  priority: QueueTicket["priority"];
  sla_policy_id: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  requester: { id: string; full_name: string; company: string | null } | null;
  assignee: { id: string; full_name: string; avatar_url: string | null } | null;
  sla_events: {
    type: string;
    status: "pending" | "completed" | "breached";
    due_at: string;
    completed_at: string | null;
    breached_at: string | null;
  }[];
};

/** A requester is guaranteed by a NOT NULL FK; this only guards against a failed embed. */
const UNKNOWN_REQUESTER: QueueRequester = {
  id: "",
  fullName: "Unknown customer",
  company: null,
};

function toQueueTicket(row: TicketRow): QueueTicket {
  const requester: QueueRequester = row.requester
    ? {
        id: row.requester.id,
        fullName: row.requester.full_name,
        company: row.requester.company,
      }
    : UNKNOWN_REQUESTER;

  const assignee: QueueAssignee | null = row.assignee
    ? {
        id: row.assignee.id,
        fullName: row.assignee.full_name,
        avatarUrl: row.assignee.avatar_url,
      }
    : null;

  /*
   * The queue's SLA column tracks resolution, not first response. `sla_events` is embedded
   * as an array because the FK is one-to-many (one row per `sla_event_type`), so the
   * resolution row is picked here rather than filtered in the query — an embedded filter
   * would drop the ticket entirely when it has no SLA at all.
   */
  const resolution = row.sla_events.find((event) => event.type === "resolution");

  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    requester,
    assignee,
    slaPolicyId: row.sla_policy_id,
    slaEvent: resolution
      ? {
          type: "resolution",
          status: resolution.status,
          dueAt: resolution.due_at,
          completedAt: resolution.completed_at,
          breachedAt: resolution.breached_at,
        }
      : null,
    firstResponseAt: row.first_response_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* --------------------------------------------------------------------------
   Reads
   -------------------------------------------------------------------------- */

/**
 * Every ticket the caller may see, newest activity first.
 *
 * Unpaginated on purpose for now: the queue filters, sorts and pages client-side (it has to
 * — the view tabs count across the whole set, and "4 breached, 5 at risk" is a property of
 * the view, not of the page). `limit` is the backstop so a tenant with 50,000 imported rows
 * cannot serialise all of them into the RSC payload. Moving the filters into the query is
 * the next step, and `types.ts` is shaped so it is a service change, not a UI one.
 */
export async function listTickets({ limit = 500 }: { limit?: number } = {}): Promise<
  QueueTicket[]
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(QUEUE_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw fail("We couldn't load your queue.", error);
  }

  return (data as unknown as TicketRow[]).map(toQueueTicket);
}

/**
 * One ticket with its conversation, or null when it does not exist *for this caller* —
 * which RLS makes indistinguishable from "not yours", deliberately. The page renders
 * `notFound()` either way, so a ticket id from another tenant leaks nothing.
 */
export async function getTicket(id: string): Promise<TicketDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(`${QUEUE_SELECT}, description`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw fail("We couldn't load that ticket.", error);
  }

  if (!data) return null;

  const row = data as unknown as TicketRow & { description: string };

  const { data: messageRows, error: messagesError } = await supabase
    .from("ticket_messages")
    .select("id, author_type, author_id, body, visibility, is_edited, edited_at, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw fail("We couldn't load that conversation.", messagesError);
  }

  /*
   * `ticket_messages.author_id` is a bare uuid with no FK — it points at `users.id` for an
   * agent and `customers.id` for a customer, so it cannot be embedded. Names are resolved in
   * one round trip per side rather than per message.
   */
  const [messages, tags, attachments] = await Promise.all([
    withAuthorNames(supabase, row, messageRows ?? []),
    listTags(supabase, id),
    listAttachments(supabase, id),
  ]);

  return { ...toQueueTicket(row), description: row.description, messages, tags, attachments };
}

/** The ticket's tags, flattened out of the `ticket_tags` join. */
async function listTags(supabase: SupabaseClient, ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_tags")
    .select("tag:tags!ticket_tags_tag_id_fkey ( id, name, color )")
    .eq("ticket_id", ticketId);

  if (error) {
    warn(`tags not loaded for ${ticketId}: ${error.message}`);
    return [];
  }

  const rows = (data ?? []) as unknown as {
    tag: { id: string; name: string; color: string | null } | null;
  }[];

  return rows.flatMap((row) => (row.tag ? [row.tag] : []));
}

/**
 * Attachment metadata only. The rows point at objects in the `ticket_attachments` bucket;
 * turning `storage_path` into something downloadable needs a signed URL, which is its own
 * round trip per file and belongs with the upload path that does not exist yet.
 */
async function listAttachments(supabase: SupabaseClient, ticketId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, filename, original_filename, mime, extension, size, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    warn(`attachments not loaded for ${ticketId}: ${error.message}`);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.original_filename || row.filename,
    extension: row.extension,
    mime: row.mime,
    size: Number(row.size),
  }));
}

type RawMessage = {
  id: string;
  author_type: "agent" | "customer" | "system";
  author_id: string;
  body: string;
  visibility: "public" | "internal";
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
};

async function withAuthorNames(
  supabase: SupabaseClient,
  ticket: TicketRow,
  rows: RawMessage[],
): Promise<TicketMessage[]> {
  const agentIds = [
    ...new Set(rows.filter((m) => m.author_type === "agent").map((m) => m.author_id)),
  ];

  const names = new Map<string, string>();

  if (agentIds.length > 0) {
    const { data } = await supabase.from("users").select("id, full_name").in("id", agentIds);

    for (const user of data ?? []) {
      names.set(user.id, user.full_name);
    }
  }

  // Customer-authored messages are always the requester on their own ticket, so the embed
  // already fetched for the header answers it without a second query.
  if (ticket.requester) {
    names.set(ticket.requester.id, ticket.requester.full_name);
  }

  return rows.map((row) => ({
    id: row.id,
    authorType: row.author_type,
    authorId: row.author_id,
    authorName:
      names.get(row.author_id) ?? (row.author_type === "system" ? "ServiceDesk Pro" : "Unknown"),
    body: row.body,
    visibility: row.visibility,
    isEdited: row.is_edited,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  }));
}

/**
 * Everything the queue page needs, in one call and against one instant.
 *
 * `now` is stamped HERE rather than in the page for two reasons. It is the honest home for
 * it — the timestamp is part of the read, and every SLA countdown on the page has to be
 * measured from the same one or two rows can disagree about whether they have breached. And
 * `Date.now()` in a component body is a `react-hooks/purity` error: impure calls during
 * render are exactly what the rule exists to catch, Server Component or not.
 */
export async function loadQueue(): Promise<{
  tickets: QueueTicket[];
  currentUserId: string | null;
  now: number;
}> {
  const [tickets, currentUserId] = await Promise.all([listTickets(), getCurrentUserId()]);

  return { tickets, currentUserId, now: Date.now() };
}

/** The server's clock, for the pages that need the instant without the rows. */
export async function serverNow(): Promise<number> {
  return Date.now();
}

/**
 * The signed-in user's id, or null. Used by the queue's "My tickets" view.
 *
 * `getUser()` rather than `getSession()` — it revalidates against the auth server instead of
 * trusting the cookie, so a forged one cannot make another agent's queue look like yours.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

/** The tenant's customers, for the new-ticket picker. */
export async function listCustomers(): Promise<
  { id: string; fullName: string; email: string; company: string | null }[]
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, email, company")
    .order("full_name", { ascending: true })
    .limit(1000);

  if (error) {
    throw fail("We couldn't load your customers.", error);
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    fullName: c.full_name,
    email: c.email,
    company: c.company,
  }));
}

/** Agents who can own a ticket, for the assignee picker. */
export async function listAssignableUsers(): Promise<{ id: string; fullName: string }[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("user:users!memberships_user_id_fkey ( id, full_name )")
    .eq("status", "active")
    .in("role", ["tenant_admin", "manager", "agent"]);

  if (error) {
    throw fail("We couldn't load your team.", error);
  }

  const rows = (data ?? []) as unknown as { user: { id: string; full_name: string } | null }[];

  return rows
    .flatMap((row) => (row.user ? [{ id: row.user.id, fullName: row.user.full_name }] : []))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/* --------------------------------------------------------------------------
   Writes
   -------------------------------------------------------------------------- */

/** The caller's tenant and id, straight off their verified token. */
async function requireActor(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new TicketError("Sign in to do that.", { status: 401, code: "unauthenticated" });
  }

  const { data: claims } = await supabase.auth.getClaims();
  const tenantId = claims?.claims?.tenant_id as string | undefined;

  if (!tenantId) {
    throw new TicketError("Your account isn't attached to an organization yet.", {
      status: 403,
      code: "forbidden",
    });
  }

  return { userId: user.id, tenantId };
}

/**
 * Create a ticket, its opening message and its resolution SLA clock.
 *
 * `number` is deliberately absent from the insert: the `set_tickets_number` trigger fills it
 * inside the same transaction, holding the advisory lock `generate_ticket_number` takes. An
 * RPC call from here would release that lock before the insert and let two concurrent
 * creates collide on `uq_ticket_number`.
 */
export async function createTicket(
  values: NewTicketValues,
): Promise<{ id: string; number: number }> {
  const supabase = await createSupabaseServerClient();
  const { userId, tenantId } = await requireActor(supabase);

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      tenant_id: tenantId,
      subject: values.subject,
      description: values.description,
      priority: values.priority,
      status: "new",
      requester_customer_id: values.requesterCustomerId,
      assignee_user_id: values.assigneeUserId,
    })
    .select("id, number, created_at")
    .single();

  if (error || !data) {
    throw fail(
      error?.code === "42501"
        ? "You don't have permission to raise tickets here."
        : "We couldn't create that ticket. Try again in a moment.",
      error,
      error?.code === "42501" ? 403 : 500,
    );
  }

  /*
   * Both follow-ups are best-effort. A ticket that exists without its opening message is
   * recoverable and visible; throwing here would leave the row created but report failure,
   * and the user would create it a second time.
   */
  await seedFirstMessage(supabase, {
    tenantId,
    ticketId: data.id,
    authorId: userId,
    body: values.description,
  });

  await startResolutionClock(supabase, {
    tenantId,
    ticketId: data.id,
    priority: values.priority,
    openedAt: data.created_at,
  });

  return { id: data.id, number: data.number };
}

async function seedFirstMessage(
  supabase: SupabaseClient,
  input: { tenantId: string; ticketId: string; authorId: string; body: string },
) {
  const { error } = await supabase.from("ticket_messages").insert({
    tenant_id: input.tenantId,
    ticket_id: input.ticketId,
    // `ticket_messages_insert` requires exactly this pair for staff: an agent row authored
    // by the caller. Anything else is refused by RLS rather than mis-attributed.
    author_type: "agent",
    author_id: input.authorId,
    body: input.body,
    visibility: "public",
  });

  if (error) {
    warn(`first message not written for ${input.ticketId}: ${error.message}`);
  }
}

/**
 * Start the resolution clock from the tenant's policy for this priority.
 *
 * `uq_sla_priority` makes (tenant, priority_scope) unique, so there is at most one. A tenant
 * that has not configured SLAs yet simply gets a ticket with no clock — the queue renders
 * "No SLA" for that, which is honest, rather than inventing a default deadline.
 */
async function startResolutionClock(
  supabase: SupabaseClient,
  input: { tenantId: string; ticketId: string; priority: string; openedAt: string },
) {
  const { data: policy } = await supabase
    .from("sla_policies")
    .select("id, resolution_mins")
    .eq("priority_scope", input.priority)
    .maybeSingle();

  if (!policy) {
    warn(`no SLA policy for priority "${input.priority}"; ticket has no clock`);
    return;
  }

  const dueAt = new Date(Date.parse(input.openedAt) + policy.resolution_mins * 60_000);

  const [{ error: eventError }, { error: linkError }] = await Promise.all([
    supabase.from("sla_events").insert({
      tenant_id: input.tenantId,
      ticket_id: input.ticketId,
      type: "resolution",
      status: "pending",
      due_at: dueAt.toISOString(),
    }),
    supabase.from("tickets").update({ sla_policy_id: policy.id }).eq("id", input.ticketId),
  ]);

  if (eventError) warn(`SLA event not created: ${eventError.message}`);
  if (linkError) warn(`SLA policy not linked: ${linkError.message}`);
}

/** The private bucket `supabase/schemas/storage/buckets.sql` declares. */
const ATTACHMENT_BUCKET = "ticket-attachments";

/** One file that was refused, and the sentence to show for it. */
export type RejectedAttachment = { filename: string; reason: string };

/**
 * Store files against a ticket, and record a row for each.
 *
 * Two writes per file, in this order on purpose: the object first, its `attachments` row
 * second. A row pointing at an object that isn't there renders as a broken attachment
 * forever, whereas an object with no row is invisible — so the failure that survives a
 * crash between them is the recoverable one. A row that fails to insert takes its object
 * back out (see below) rather than leaving that orphan behind.
 *
 * Partial success is a real outcome, not an error: one refused file must not throw away
 * the four that uploaded. Callers get the count and the refusals and decide what to say.
 */
export async function addAttachments(
  ticketId: string,
  files: File[],
): Promise<{ uploaded: number; rejected: RejectedAttachment[] }> {
  const supabase = await createSupabaseServerClient();
  const { userId, tenantId } = await requireActor(supabase);

  /*
   * Prove the ticket is one this caller can see BEFORE writing anything under its id.
   *
   * `ticket_attachments_insert` only checks that the first path segment is the caller's
   * own tenant for staff — it never looks at the ticket — so without this an agent could
   * hang objects off any id, including one that does not exist. `tickets_select` is what
   * answers the question, so a row we cannot read is a row we must not attach to.
   */
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    throw fail("We couldn't attach those files.", ticketError);
  }

  if (!ticket) {
    throw new TicketError("That ticket doesn't exist, or isn't yours to attach to.", {
      status: 404,
      code: "not_found",
    });
  }

  const rejected: RejectedAttachment[] = [];
  let uploaded = 0;

  for (const file of files) {
    const reason = rejectAttachment(file);

    if (reason) {
      rejected.push({ filename: file.name, reason });
      continue;
    }

    // Non-null: `rejectAttachment` returns a reason when the extension isn't recognised.
    const extension = attachmentExtension(file.name)!;
    const mime = attachmentMime(extension);

    /*
     * `<tenant>/<ticket>/<uuid>.<ext>` — the exact shape the storage policies read with
     * `storage.foldername(name)[1]` and `[2]`. The stored name is a UUID rather than the
     * user's: two files called `screenshot.png` would otherwise collide on
     * `uq_storage_path`, and a filename off the wire is not something to interpolate into
     * a path at all. The original is kept in `original_filename` and is what the UI shows.
     */
    const storedName = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `${tenantId}/${ticketId}/${storedName}`;

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, file, { contentType: mime, upsert: false });

    if (uploadError) {
      warn(`attachment not stored for ${ticketId}: ${uploadError.message}`);
      rejected.push({ filename: file.name, reason: "We couldn't store that file." });
      continue;
    }

    const { error: rowError } = await supabase.from("attachments").insert({
      tenant_id: tenantId,
      ticket_id: ticketId,
      storage_path: storagePath,
      filename: storedName,
      original_filename: file.name,
      mime,
      extension,
      size: file.size,
      uploaded_by: userId,
    });

    if (rowError) {
      // Take the object back out. Nothing lists the bucket directly, so an object with no
      // row is unreachable by the UI *and* by retention — and `uq_storage_path` would not
      // stop the user simply trying again, because the retry gets a fresh UUID.
      const { error: cleanupError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([storagePath]);

      if (cleanupError) {
        warn(`orphaned object ${storagePath}: ${cleanupError.message}`);
      }

      warn(`attachment row not written for ${ticketId}: ${rowError.message}`);
      rejected.push({ filename: file.name, reason: "We couldn't store that file." });
      continue;
    }

    uploaded += 1;
  }

  return { uploaded, rejected };
}

/** Post a reply or an internal note. */
export async function addMessage(values: ReplyValues): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { userId, tenantId } = await requireActor(supabase);

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      tenant_id: tenantId,
      ticket_id: values.ticketId,
      author_type: "agent",
      author_id: userId,
      body: values.body,
      visibility: values.visibility,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw fail(
      error?.code === "42501"
        ? "You don't have permission to reply on this ticket."
        : "We couldn't post that reply. Try again in a moment.",
      error,
      error?.code === "42501" ? 403 : 500,
    );
  }

  /*
   * First public agent reply stamps `first_response_at` and completes the first-response
   * clock. Internal notes deliberately do not — the customer has not heard anything.
   */
  if (values.visibility === "public") {
    await markFirstResponse(supabase, values.ticketId);
  }

  return { id: data.id };
}

async function markFirstResponse(supabase: SupabaseClient, ticketId: string) {
  const { data: ticket } = await supabase
    .from("tickets")
    .select("first_response_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket || ticket.first_response_at) return;

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tickets")
    .update({ first_response_at: now })
    .eq("id", ticketId);

  if (error) {
    warn(`first_response_at not stamped on ${ticketId}: ${error.message}`);
    return;
  }

  await supabase
    .from("sla_events")
    .update({ status: "completed", completed_at: now })
    .eq("ticket_id", ticketId)
    .eq("type", "first_response")
    .eq("status", "pending");
}

/**
 * Inline property edits from the detail page.
 *
 * Moving into a terminal status stamps `resolved_at`/`closed_at` and settles the resolution
 * clock, so the SLA pill stops counting the moment the work is actually done.
 */
export async function updateTicket(values: UpdateTicketValues): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await requireActor(supabase);

  const patch: Record<string, unknown> = {};
  const now = new Date().toISOString();

  if (values.priority) patch["priority"] = values.priority;
  if (values.assigneeUserId !== undefined) patch["assignee_user_id"] = values.assigneeUserId;

  if (values.status) {
    patch["status"] = values.status;

    if (values.status === "resolved") patch["resolved_at"] = now;
    if (values.status === "closed") {
      patch["resolved_at"] = now;
      patch["closed_at"] = now;
    }
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("tickets").update(patch).eq("id", values.ticketId);

  if (error) {
    throw fail(
      error.code === "42501"
        ? "You don't have permission to change this ticket."
        : "We couldn't save that change. Try again in a moment.",
      error,
      error.code === "42501" ? 403 : 500,
    );
  }

  if (values.status && (values.status === "resolved" || values.status === "closed")) {
    await supabase
      .from("sla_events")
      .update({ status: "completed", completed_at: now })
      .eq("ticket_id", values.ticketId)
      .eq("type", "resolution")
      .eq("status", "pending");
  }
}

/** Dev-only breadcrumb for the swallowed, non-fatal failures above. */
function warn(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[tickets] ${message}`);
  }
}
