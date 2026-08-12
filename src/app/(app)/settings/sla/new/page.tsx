import type { Metadata } from "next";

import { SlaEditor } from "@/features/settings/components/sla-editor";
import { blankSlaPolicy } from "@/features/settings/lib/mock-sla";

export const metadata: Metadata = {
  title: "New SLA policy",
  alternates: {
    canonical: "/settings/sla/new",
  },
};

/**
 * Create a policy.
 *
 * A separate segment rather than `/settings/sla/[id]?new=1`, because the design treats it as
 * a distinct state (`slaNew` drives both the title, "New SLA policy", and the submit label,
 * "Create policy"). It sits BEFORE `[id]` in the routing order, so `new` can never be
 * mistaken for a policy id.
 *
 * ███ UI-ONLY — nothing is created. Save validates, then returns to the list. ███
 */
export default function NewSlaPolicyPage() {
  return <SlaEditor policy={blankSlaPolicy()} mode="new" />;
}
