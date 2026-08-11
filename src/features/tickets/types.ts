import type { SlaState, TicketPriority, TicketStatus } from "@/lib/badge-tones";

export type { SlaState, TicketPriority, TicketStatus };

/**
 * The row shape the queue renders.
 *
 * This mirrors what a real tenant-scoped query returns, so wiring is a swap of the data
 * source and not a rewrite of the component. Every field below is either a column of
 * `public.tickets` (supabase/schemas/tables/10_tickets.sql), a column of a table it joins
 * to, or is marked DERIVED with the arithmetic that produces it.
 *
 * ```sql
 * select t.id, t.number, t.subject, t.status, t.priority, t.sla_policy_id,
 *        t.first_response_at, t.resolved_at, t.closed_at, t.created_at, t.updated_at,
 *        requester:customers!tickets_requester_customer_id_fkey ( id, full_name ),
 *        assignee:users!tickets_assignee_user_id_fkey ( id, full_name, avatar_url ),
 *        sla_event:sla_events ( type, status, due_at, completed_at, breached_at )
 *   from tickets t
 *  where t.tenant_id = current_tenant_id()      -- enforced by RLS, policies/09_tickets.sql
 *    and sla_event.type = 'resolution'
 * ```
 *
 * ⚠ ONE FIELD HAS NO COLUMN BEHIND IT — see `QueueRequester.company`.
 */
export type QueueTicket = {
  /** `tickets.id` */
  id: string;
  /** `tickets.number` — bigint, sequential per tenant, unique with `tenant_id`. */
  number: number;
  /** `tickets.subject` */
  subject: string;
  /** `tickets.status` — `public.ticket_status`. */
  status: TicketStatus;
  /** `tickets.priority` — `public.ticket_priority`. */
  priority: TicketPriority;
  /** Join on `tickets.requester_customer_id` — NOT NULL, so never null here. */
  requester: QueueRequester;
  /** Join on `tickets.assignee_user_id` — nullable column, so `null` means unassigned. */
  assignee: QueueAssignee | null;
  /** `tickets.sla_policy_id` — carried so the row can link to the policy that governs it. */
  slaPolicyId: string | null;
  /** The `resolution` row from `sla_events` for this ticket, or null if no policy applied. */
  slaEvent: QueueSlaEvent | null;
  /** `tickets.first_response_at` */
  firstResponseAt: string | null;
  /** `tickets.resolved_at` */
  resolvedAt: string | null;
  /** `tickets.closed_at` */
  closedAt: string | null;
  /** `tickets.created_at` */
  createdAt: string;
  /** `tickets.updated_at` — the queue's default sort. */
  updatedAt: string;
};

export type QueueRequester = {
  /** `customers.id` */
  id: string;
  /** `customers.full_name` */
  fullName: string;
  /**
   * `customers.company`, added by migration `20260810210000_add_customer_company` to close
   * the gap the UI-only queue pass reported. Nullable — an individual customer legitimately
   * has none — and every call site drops the caption line rather than rendering an empty one.
   */
  company: string | null;
};

export type QueueAssignee = {
  /** `users.id` */
  id: string;
  /** `users.full_name` */
  fullName: string;
  /** `users.avatar_url` */
  avatarUrl: string | null;
};

/** A `public.sla_events` row — `type` is pinned to `resolution` for the queue's SLA column. */
export type QueueSlaEvent = {
  /** `sla_events.type` — `public.sla_event_type`. */
  type: "resolution";
  /** `sla_events.status` — `public.sla_event_status`. */
  status: "pending" | "completed" | "breached";
  /** `sla_events.due_at` */
  dueAt: string;
  /** `sla_events.completed_at` */
  completedAt: string | null;
  /** `sla_events.breached_at` */
  breachedAt: string | null;
};

/** DERIVED from `slaEvent` + the current instant. Not stored. */
export type QueueSla = {
  state: SlaState;
  /** "22m left" · "Breached 26m" · "Met in 1h 12m" — the design's own vocabulary. */
  label: string;
};

/** One row of `public.ticket_messages`, with its author resolved to a name. */
export type TicketMessage = {
  /** `ticket_messages.id` */
  id: string;
  /** `ticket_messages.author_type` — `public.author_type`. */
  authorType: "agent" | "customer" | "system";
  /**
   * `ticket_messages.author_id`. A bare uuid with no FK: it points at `users.id` for an
   * agent and `customers.id` for a customer, which is why the name is resolved in the
   * service rather than embedded in the query.
   */
  authorId: string;
  /** DERIVED — looked up from `users` or the ticket's requester. */
  authorName: string;
  /** `ticket_messages.body` */
  body: string;
  /**
   * `ticket_messages.visibility` — `public.message_visibility`. `internal` never reaches the
   * customer portal; `ticket_messages_select` filters customers to public rows.
   */
  visibility: "public" | "internal";
  /** `ticket_messages.is_edited` */
  isEdited: boolean;
  /** `ticket_messages.edited_at` */
  editedAt: string | null;
  /** `ticket_messages.created_at` */
  createdAt: string;
};

/** A `public.tags` row reached through `ticket_tags`. */
export type TicketTag = {
  id: string;
  name: string;
  /** `tags.color` — unused so far; the design renders tags in the neutral badge tone. */
  color: string | null;
};

/**
 * `public.attachments` metadata. No URL: the rows point at objects in the
 * `ticket_attachments` bucket, and turning `storage_path` into something downloadable needs
 * a signed URL per file, which belongs with the upload path.
 */
export type TicketAttachment = {
  id: string;
  filename: string;
  extension: string | null;
  mime: string;
  /** `attachments.size`, in bytes. */
  size: number;
};

/**
 * A customer the New ticket sheet can raise a ticket for.
 *
 * Lives here rather than beside the sheet because the sheet is not the only consumer, and
 * a client component importing a type out of another client component made the queue's
 * props depend on the sheet's file for no reason.
 */
export type CustomerOption = {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
};

/** An agent who can own a ticket, for `/tickets/[id]`'s properties panel. */
export type AssigneeOption = { id: string; fullName: string };

/** A queue row plus everything `/tickets/[id]` needs on top of it. */
export type TicketDetail = QueueTicket & {
  /** `tickets.description` — the opening report, NOT NULL. */
  description: string;
  messages: TicketMessage[];
  tags: TicketTag[];
  attachments: TicketAttachment[];
};

/**
 * Why a ticket action failed, in terms the UI can branch on. Mirrors `AuthFailureCode`'s
 * job: a closed set we own, rather than a Postgres SQLSTATE reaching the form.
 */
export type TicketFailureCode =
  "validation" | "unauthenticated" | "forbidden" | "not_found" | "conflict" | "unknown";

/** Same envelope contract as the auth feature's, keyed to this feature's failure codes. */
export type TicketActionResult<TData> =
  | { success: true; data: TData }
  | {
      success: false;
      message: string;
      code: TicketFailureCode;
      fieldErrors?: Record<string, string[]>;
    };

/** The five saved views the design ships as tabs. */
export type QueueView = "all" | "mine" | "unassigned" | "breaching" | "solved";

/** Which of the four designed states to render. Demo-only — see `ticket-queue.tsx`. */
export type QueueState = "default" | "loading" | "empty" | "error";

/** Display labels. The enum values are snake_case; the design's chrome is not. */
export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  pending: "Pending",
  on_hold: "On hold",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

/** `resolved` and `closed` are the two terminal statuses — the "Solved" view. */
export const SOLVED_STATUSES: readonly TicketStatus[] = ["resolved", "closed"];

/* ---------------------------------------------------------------------------
   SAVED VIEWS — /views
   --------------------------------------------------------------------------- */

/**
 * The predicate a saved view stores, i.e. the decoded contents of
 * `saved_views.filter_json` (jsonb, NOT NULL, default `{}`).
 *
 * The column is schemaless by design, so this type is the FRONTEND's contract for what
 * it holds — not something the database enforces. It is deliberately shaped like the
 * queue's own filter vocabulary (`QueueView` + the status/priority pickers) so a view
 * can be applied to the queue without a translation layer.
 *
 * Every field is optional: `{}` is a legal, meaningful value — a view that matches
 * everything. The design's Edit-view modal exposes only three canned predicates
 * ("Status is Open or Pending" · "Assignee is me" · "SLA is breaching"), which is a
 * strict subset of what this shape can express.
 */
export type SavedViewFilter = {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  /**
   * `"me"` resolves against the session user at read time — it is stored as the literal,
   * NOT as the author's id, so a shared "Assigned to me" view means something different
   * to each teammate who opens it. `"unassigned"` means `assignee_user_id is null`.
   * `{ userId }` pins the view to one specific agent.
   */
  assignee?: "me" | "unassigned" | { userId: string };
  sla?: SlaState[];
};

/** The owner of a saved view, joined from `users` on `saved_views.owner_user_id`. */
export type SavedViewOwner = {
  /** `users.id` */
  id: string;
  /** `users.full_name` */
  fullName: string;
};

/**
 * One row of the saved-views list.
 *
 * Mirrors a real per-user-scoped query so wiring is a swap of the data source, not a
 * rewrite of the component. Every field is a column of `public.saved_views`
 * (supabase/schemas/tables/16_saved_views.sql), a column of a table it joins to, or is
 * marked DERIVED.
 *
 * ```sql
 * select v.id, v.tenant_id, v.owner_user_id, v.name, v.filter_json, v.is_shared,
 *        v.created_at, v.updated_at,
 *        owner:users!saved_views_owner_user_id_fkey ( id, full_name )
 *   from saved_views v
 *  where v.tenant_id = current_tenant_id()   -- RLS
 *    and (v.is_shared or v.owner_user_id = auth.uid())   -- P2-9, wiring slice
 *  order by v.created_at
 * ```
 *
 * ⚠ TWO FIELDS HAVE NO COLUMN BEHIND THEM — `ticketCount` and `owner`, see each.
 * ⚠ `isShared` and `owner` are CARRIED BUT NOT RENDERED — see the note on `isShared`.
 */
export type SavedView = {
  /** `saved_views.id` */
  id: string;
  /** `saved_views.tenant_id` — scoping is RLS's job; carried so the row is round-trippable. */
  tenantId: string;
  /** `saved_views.owner_user_id` */
  ownerUserId: string;
  /** `saved_views.name` — the only field the design's modal edits. */
  name: string;
  /** `saved_views.filter_json` */
  filterJson: SavedViewFilter;
  /**
   * `saved_views.is_shared` — true = visible to the whole tenant, false = private to
   * `ownerUserId`.
   *
   * NOTHING IN THIS PASS RENDERS IT. The design has no shared/private treatment on this
   * screen at all — no badge, no grouping, no toggle, and the Edit modal exposes only a
   * name and a filter. It is carried here anyway so the mock rows already have the shape
   * a real query returns, and so the RLS predicate above has a matching frontend field
   * the moment a design lands for it. See docs/SAVED-VIEWS-DIFF.md § "Not in the design".
   */
  isShared: boolean;
  /**
   * DERIVED — join on `owner_user_id`. Not rendered either, for the same reason: the
   * design never shows who created a view.
   */
  owner: SavedViewOwner;
  /**
   * DERIVED — `count(*)` over `tickets` matching `filterJson`. NOT a column of
   * `saved_views`, and not cheap: the wiring slice needs one aggregate per view (or a
   * single grouped query), which is why it is modelled outside the row proper.
   */
  ticketCount: number;
  /** `saved_views.created_at` — the design's list order. */
  createdAt: string;
  /** `saved_views.updated_at` */
  updatedAt: string;
};

/** Which of the two built states to render. Demo-only — see `saved-views-list.tsx`. */
export type SavedViewsState = "default" | "empty";
