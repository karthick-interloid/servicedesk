import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerRecord } from "@/features/customers/components/customer-record";
import { MOCK_COMPANIES, findCompany } from "@/features/customers/lib/mock-companies";

/**
 * Pre-render every mock company. This is what makes the List→Record walk real rather than
 * nominal: each `/customers/<id>` in the list resolves to a page that exists at build time,
 * and a typo in a mock id becomes a build-time 404 instead of a runtime surprise.
 */
export function generateStaticParams() {
  return MOCK_COMPANIES.map((company) => ({ id: company.id }));
}

export async function generateMetadata(props: PageProps<"/customers/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const company = findCompany(id);

  return {
    title: company ? company.name : "Customer not found",
    alternates: { canonical: `/customers/${id}` },
  };
}

/**
 * A single company's record.
 *
 * ███ UI-ONLY — resolved against `MOCK_COMPANIES`, a local module. ███
 *
 * The design draws NO not-found treatment for this screen (the harness registers only
 * `["Default"]`), so an unknown id falls through to `notFound()` and the app's existing
 * `not-found.tsx`. That is a deliberate reuse of the shell's own 404 rather than an
 * authored per-screen empty — inventing one would be inventing a screen.
 */
export default async function CustomerRecordPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  const company = findCompany(id);

  if (!company) {
    notFound();
  }

  return <CustomerRecord company={company} />;
}
