import type { Metadata } from "next";

import { SavedViewsList } from "@/features/tickets/components/saved-views-list";
import { listSavedViews } from "@/features/tickets/services/saved-view.service";

export const metadata: Metadata = {
  title: "Saved views",
  alternates: {
    canonical: "/views",
  },
};

/**
 * Saved views management.
 *
 * The route segment is `views`, not `tickets/saved-views`: the design registers this
 * screen as `scrViews: s.route === "views"` and its sidebar links it at the top level,
 * which `src/features/shell/lib/nav.ts` already transcribes as `/views`. Nesting it under
 * `/tickets` would break the sidebar's longest-prefix active match — `/tickets` would
 * light up instead of "Saved views".
 *
 * WIRED. `listSavedViews()` reads `public.saved_views` on the anon key plus the caller's
 * own session, so the rows are exactly what `saved_views_select` allows: the caller's own
 * views plus the tenant's shared ones. A colleague's private view is not merely hidden
 * here — it never leaves Postgres.
 *
 * The `?state=empty` demo parameter is GONE. It existed only because the rows were a
 * hard-coded module with no way to look at the empty card; the empty state is now simply a
 * tenant with no views, which is reachable for real.
 *
 * No try/catch: a failed read is a genuine server error, and the app's own `error.tsx`
 * boundary is the treatment for it. The design registers only `["Default"]` for this
 * screen — it draws no error card — so catching here would mean inventing one. Same
 * reasoning `/customers/[id]` gives for falling through to `not-found.tsx`.
 */
export default async function SavedViewsPage() {
  const views = await listSavedViews();

  return <SavedViewsList views={views} />;
}
