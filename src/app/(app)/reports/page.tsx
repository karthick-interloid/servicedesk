import type { Metadata } from "next";

import { ReportsDashboard } from "@/features/reports/components/reports-dashboard";
import type { ReportsState } from "@/features/reports/types";

export const metadata: Metadata = {
  title: "Reports",
  alternates: {
    canonical: "/reports",
  },
};

const STATES: readonly ReportsState[] = ["default", "loading"];

/**
 * Reports — a SINGLE screen, not a section.
 *
 * Verified against the design before building: `design-reference/_capture-report.json`
 * registers one entry, `{ screen: "Reports", value: "reports" }`, and the sidebar links it
 * once at `/reports` (`features/shell/lib/nav.ts`). There are no per-metric drill-downs to
 * follow up on — every figure on the screen is terminal, and nothing on it is a link.
 *
 * ███ UI-ONLY — every figure is `mock-reports.ts`, a local module. ███
 *
 * No Supabase client, no query, no server action, which is why this is a plain synchronous
 * Server Component. The wiring slice replaces the mock module's exports with aggregate
 * reads (`tickets` grouped by priority, `sla_events` by status, a memberships join for the
 * agent table) and this file becomes async — `ReportsDashboard` does not change.
 *
 * `?state=loading` forces the design's skeleton, matching the convention `/tickets` and
 * `/views` already use. It earns its keep here for the same reason it does there: with the
 * data hard-coded there is otherwise no way to look at the loading state at all.
 */
export default async function ReportsPage(props: PageProps<"/reports">) {
  const { state } = await props.searchParams;
  const requested = Array.isArray(state) ? state[0] : state;
  const demoState = STATES.includes(requested as ReportsState)
    ? (requested as ReportsState)
    : "default";

  return <ReportsDashboard state={demoState} />;
}
