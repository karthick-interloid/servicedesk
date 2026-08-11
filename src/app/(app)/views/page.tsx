import type { Metadata } from "next";

import { SavedViewsList } from "@/features/tickets/components/saved-views-list";
import { MOCK_SAVED_VIEWS } from "@/features/tickets/lib/mock-saved-views";
import type { SavedViewsState } from "@/features/tickets/types";

export const metadata: Metadata = {
  title: "Saved views",
  alternates: {
    canonical: "/views",
  },
};

const STATES: readonly SavedViewsState[] = ["default", "empty"];

/**
 * Saved views management.
 *
 * The route segment is `views`, not `tickets/saved-views`: the design registers this
 * screen as `scrViews: s.route === "views"` and its sidebar links it at the top level,
 * which `src/features/shell/lib/nav.ts` already transcribes as `/views`. Nesting it under
 * `/tickets` would break the sidebar's longest-prefix active match — `/tickets` would
 * light up instead of "Saved views".
 *
 * ███ UI-ONLY — the rows are `MOCK_SAVED_VIEWS`, a local module. ███
 *
 * No Supabase client, no query, no server action. That is why this is a plain synchronous
 * Server Component while `/tickets` is async: there is nothing to await. The wiring slice
 * replaces the `MOCK_SAVED_VIEWS` import with a per-user-scoped `saved_views` read (the
 * query is written out on `SavedView` in features/tickets/types.ts) and this file becomes
 * async — `SavedViewsList` does not change.
 *
 * `?state=empty` forces the empty card, matching the convention `/tickets` already uses
 * for its four states. It exists because the data is stubbed: with ten hard-coded rows
 * there is otherwise no way to look at the empty state.
 */
export default async function SavedViewsPage(props: PageProps<"/views">) {
  const { state } = await props.searchParams;
  const requested = Array.isArray(state) ? state[0] : state;
  const demoState = STATES.includes(requested as SavedViewsState)
    ? (requested as SavedViewsState)
    : "default";

  // The empty state is just an empty row list — `SavedViewsList` needs no flag for it.
  return <SavedViewsList views={demoState === "empty" ? [] : MOCK_SAVED_VIEWS} />;
}
