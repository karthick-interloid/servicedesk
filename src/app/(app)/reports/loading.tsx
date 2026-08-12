import { ReportsLoading } from "@/features/reports/components/reports-dashboard";

/**
 * The design's `stLoading` for this screen, now driven by the real aggregate query rather
 * than by `?state=loading`.
 *
 * Next renders this while `page.tsx` awaits `getReportsOverview()`, so the skeleton the
 * design draws is finally showing what it was drawn for. It is the whole reason the demo
 * parameter could be retired instead of merely deleted — the state is still reachable, and
 * now it is reachable honestly.
 */
export default function Loading() {
  return <ReportsLoading />;
}
