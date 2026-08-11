import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SlaEditor } from "@/features/settings/components/sla-editor";
import { MOCK_SLA_POLICIES, findSlaPolicy } from "@/features/settings/lib/mock-sla";

/**
 * Pre-render every mock policy, so a List→Editor click resolves to a page that exists at
 * build time and a typo in a mock id becomes a build failure rather than a runtime one.
 */
export function generateStaticParams() {
  return MOCK_SLA_POLICIES.map((policy) => ({ id: policy.id }));
}

export async function generateMetadata(props: PageProps<"/settings/sla/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const policy = findSlaPolicy(id);

  return {
    title: policy ? policy.name : "Policy not found",
    alternates: { canonical: `/settings/sla/${id}` },
  };
}

/**
 * Edit one policy.
 *
 * ███ UI-ONLY — resolved against `MOCK_SLA_POLICIES`. Save validates, then returns to the
 * list without persisting; the list still shows the original values. ███
 *
 * The design draws no not-found treatment for this screen (the harness registers only
 * `["Default"]`), so an unknown id falls through to the app's existing `not-found.tsx`
 * rather than an authored per-screen empty.
 */
export default async function SlaPolicyEditorPage(props: PageProps<"/settings/sla/[id]">) {
  const { id } = await props.params;
  const policy = findSlaPolicy(id);

  if (!policy) {
    notFound();
  }

  return <SlaEditor policy={policy} mode="edit" />;
}
