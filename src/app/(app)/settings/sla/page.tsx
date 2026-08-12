import type { Metadata } from "next";

import { SlaList } from "@/features/settings/components/sla-list";
import { MOCK_SLA_POLICIES } from "@/features/settings/lib/mock-sla";
import type { SlaListState } from "@/features/settings/types";

export const metadata: Metadata = {
  title: "SLA policies",
  alternates: {
    canonical: "/settings/sla",
  },
};

const STATES: readonly SlaListState[] = ["default", "empty"];

/**
 * The SLA policy list.
 *
 * ███ UI-ONLY — rows are `MOCK_SLA_POLICIES`, a local module. ███
 *
 * No Supabase client, no query, no mutation. ⚠ These rows CANNOT come from today's
 * `sla_policies` as they stand — see `src/features/settings/types.ts` for the grain
 * conflict with `unique (tenant_id, priority_scope)` and the four fields with no column.
 *
 * `?state=empty` forces the design's own empty card (`stEmpty`, which the harness registers
 * for this screen), matching the convention `/tickets`, `/views` and `/customers` use.
 */
export default async function SlaPoliciesPage(props: PageProps<"/settings/sla">) {
  const { state } = await props.searchParams;
  const requested = Array.isArray(state) ? state[0] : state;
  const demoState = STATES.includes(requested as SlaListState)
    ? (requested as SlaListState)
    : "default";

  return <SlaList policies={demoState === "empty" ? [] : MOCK_SLA_POLICIES} />;
}
