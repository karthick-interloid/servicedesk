import type { Metadata } from "next";

import { ReportsDashboard } from "@/features/reports/components/reports-dashboard";
import { getReportsOverview } from "@/features/reports/services/reports.service";

export const metadata: Metadata = {
  title: "Reports",
  alternates: {
    canonical: "/reports",
  },
};

/**
 * Reports — a SINGLE screen, not a section.
 *
 * Verified against the design before building: `design-reference/_capture-report.json`
 * registers one entry, `{ screen: "Reports", value: "reports" }`, and the sidebar links it
 * once at `/reports` (`features/shell/lib/nav.ts`). There are no per-metric drill-downs to
 * follow up on — every figure on the screen is terminal, and nothing on it is a link.
 *
 * WIRED. Every figure comes from `public.reports_overview()`, a SECURITY INVOKER RPC, so
 * `tickets_select` and the `sla_events` policies scope the aggregate — one round trip, no
 * tenant filter in application code. See `features/reports/services/reports.service.ts`.
 *
 * The `?state=loading` demo parameter is GONE: `loading.tsx` now renders the design's
 * skeleton against the real await, which is what it was standing in for.
 *
 * No try/catch, for the same reason `/views` gives: the design registers no error state
 * for this screen, so a failed read belongs to the app's own `error.tsx` boundary rather
 * than to an invented card.
 */
export default async function ReportsPage() {
  const overview = await getReportsOverview();

  return <ReportsDashboard overview={overview} />;
}
