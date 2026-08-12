import { createSupabaseServerClient } from "@/lib/supabase/server";

import { countMatching } from "@/features/tickets/lib/saved-view-filter";
import type { SavedView, SavedViewFilter } from "@/features/tickets/types";

import { TicketError, getCurrentUserId, listTickets } from "./ticket.service";

/**
 * Saved views — the only module that talks to Supabase for `public.saved_views`.
 *
 * ⚠ SERVER ONLY, same contract as `ticket.service.ts`: callers are Server Actions and
 * Server Components, it never imports React, and it returns domain values or throws
 * `TicketError`.
 *
 * Every call runs on the anon key plus the caller's own access token, so
 * `supabase/schemas/policies/15_saved_views.sql` is what actually scopes the rows. That
 * file was rewritten in migration `20260811060000_fix_saved_views_per_user_rls` to close
 * audit finding P2-9: the SELECT policy is now
 *
 *     tenant_id = current_tenant_id() AND is_active_membership()
 *     AND (owner_user_id = auth.uid() OR is_shared)
 *
 * so `listSavedViews()` returns the caller's own views plus the tenant's shared ones and
 * nothing else. There is NO `.eq("owner_user_id", …)` or `.or("is_shared…")` below and
 * there must not be — a predicate here would read as the security boundary while RLS did
 * the real work, and the two would drift. The same rule `ticket.service.ts` states.
 *
 * UPDATE and DELETE are owner-only in the policy, which is why the mutations below do not
 * check ownership either: a write against a colleague's private view matches no row and
 * affects nothing. `requireOwnedRow` turns that silent no-op into a `not_found`, so a
 * denied write surfaces as a failure instead of a save that appears to succeed.
 */

const SAVED_VIEW_SELECT = `
  id,
  tenant_id,
  owner_user_id,
  name,
  filter_json,
  is_shared,
  created_at,
  updated_at,
  owner:users!saved_views_owner_user_id_fkey ( id, full_name )
` as const;

type SavedViewRow = {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  name: string;
  filter_json: SavedViewFilter | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  owner: { id: string; full_name: string } | null;
};

function fail(message: string, error: { code?: string; message: string }): TicketError {
  console.error(`[saved-views] ${message}`, error);

  // 42501 is Postgres' insufficient_privilege — what RLS raises when a WITH CHECK fails.
  if (error.code === "42501") {
    return new TicketError("You can only change your own saved views.", {
      status: 403,
      code: "forbidden",
    });
  }

  return new TicketError(message, { status: 500, code: "unknown" });
}

/**
 * The caller's tenant, read off the JWT claim rather than looked up.
 *
 * It has to be the claim: `saved_views_insert` checks `tenant_id = current_tenant_id()`,
 * which is `auth.jwt()->>'tenant_id'`. Deriving it from `memberships` instead could hand
 * the INSERT a tenant the token does not actually assert, and the write would be rejected
 * with a confusing 42501 rather than a clear one.
 */
async function currentContext(): Promise<{ tenantId: string; userId: string }> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw fail("We couldn't read your session.", error);
  }

  const tenantId = data?.claims?.tenant_id as string | undefined;
  const userId = data?.claims?.sub as string | undefined;

  if (!tenantId || !userId) {
    throw new TicketError("Your session isn't attached to an organization.", {
      status: 401,
      code: "unauthenticated",
    });
  }

  return { tenantId, userId };
}

function toSavedView(row: SavedViewRow, ticketCount: number): SavedView {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    filterJson: row.filter_json ?? {},
    isShared: row.is_shared,
    // The join can come back null only if the owner's `users` row is invisible to the
    // caller, which `users_select` allows for a member who has since been deactivated.
    // The row is still legitimately visible when it is shared, so this degrades rather
    // than dropping the view out of the list.
    owner: {
      id: row.owner?.id ?? row.owner_user_id,
      fullName: row.owner?.full_name ?? "Unknown",
    },
    ticketCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Every saved view the caller may see, with its live ticket count.
 *
 * The counts are computed here rather than in SQL on purpose. `filter_json`'s `sla` key is
 * a DERIVED state — "breaching" is a function of `due_at` against the current instant, not
 * a stored column — and `assignee: "me"` resolves against the session. Both already have
 * exactly one implementation, in `lib/queue-format.ts`, which the queue itself renders
 * from. Counting through `matchesSavedViewFilter` reuses it; a SQL translation would be a
 * second implementation of the same rules, free to disagree with the screen the view opens.
 *
 * One `listTickets()` read serves every view, so this is two round trips regardless of how
 * many views the caller has — not one per view.
 */
export async function listSavedViews(): Promise<SavedView[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data, error }, tickets, currentUserId] = await Promise.all([
    supabase.from("saved_views").select(SAVED_VIEW_SELECT).order("created_at", { ascending: true }),
    listTickets(),
    getCurrentUserId(),
  ]);

  if (error) {
    throw fail("We couldn't load your saved views.", error);
  }

  const now = Date.now();

  return (data as unknown as SavedViewRow[]).map((row) =>
    toSavedView(row, countMatching(tickets, row.filter_json ?? {}, { currentUserId, now })),
  );
}

/**
 * Create a view owned by the caller.
 *
 * `owner_user_id` is the caller's own id and nothing else — `saved_views_insert` enforces
 * `owner_user_id = auth.uid()`, so there is no way to create a view on someone's behalf and
 * no parameter offering to.
 */
export async function createSavedView({
  name,
  filterJson = {},
  isShared = false,
}: {
  name: string;
  filterJson?: SavedViewFilter;
  isShared?: boolean;
}): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { tenantId, userId } = await currentContext();

  const { data, error } = await supabase
    .from("saved_views")
    .insert({
      tenant_id: tenantId,
      owner_user_id: userId,
      name,
      filter_json: filterJson,
      is_shared: isShared,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw fail("We couldn't create that view.", error ?? { message: "no row returned" });
  }

  return { id: data.id };
}

/**
 * Apply an owner-only write, and turn RLS's silent no-op into a real failure.
 *
 * An UPDATE or DELETE against a row the policy hides matches nothing and returns an empty
 * set with no error — indistinguishable, from the caller's side, from a save that worked.
 * `.select()` on the mutation is what makes the difference observable.
 */
async function requireOwnedRow<T>(
  rows: T[] | null,
  error: { code?: string; message: string } | null,
  failureMessage: string,
): Promise<void> {
  if (error) {
    throw fail(failureMessage, error);
  }

  if (!rows || rows.length === 0) {
    throw new TicketError("That view no longer exists, or it isn't yours to change.", {
      status: 404,
      code: "not_found",
    });
  }
}

export async function renameSavedView({ id, name }: { id: string; name: string }): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_views")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  await requireOwnedRow(data, error, "We couldn't rename that view.");
}

/** Flip `saved_views.is_shared` — the real column, not a client-side flag. */
export async function setSavedViewShared({
  id,
  isShared,
}: {
  id: string;
  isShared: boolean;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("saved_views")
    .update({ is_shared: isShared, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  await requireOwnedRow(data, error, "We couldn't change who can see that view.");
}

export async function deleteSavedView(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("saved_views").delete().eq("id", id).select("id");

  await requireOwnedRow(data, error, "We couldn't delete that view.");
}
