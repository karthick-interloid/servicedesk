import type { Metadata } from "next";

import { CustomersList } from "@/features/customers/components/customers-list";
import { MOCK_COMPANIES } from "@/features/customers/lib/mock-companies";
import type { CustomersState } from "@/features/customers/types";

export const metadata: Metadata = {
  title: "Customers",
  alternates: {
    canonical: "/customers",
  },
};

const STATES: readonly CustomersState[] = ["default", "empty"];

/**
 * The customers list — which, per the design, lists COMPANIES. See
 * `src/features/customers/types.ts` for why that entity has no table yet.
 *
 * ███ UI-ONLY — rows are `MOCK_COMPANIES`, a local module. ███
 *
 * No Supabase client, no query, no server action. `?state=empty` forces the design's own
 * empty card (`stEmpty`, which the harness registers for this screen), matching the
 * convention `/tickets` and `/views` already use — necessary because the data is stubbed.
 */
export default async function CustomersPage(props: PageProps<"/customers">) {
  const { state } = await props.searchParams;
  const requested = Array.isArray(state) ? state[0] : state;
  const demoState = STATES.includes(requested as CustomersState)
    ? (requested as CustomersState)
    : "default";

  return <CustomersList companies={demoState === "empty" ? [] : MOCK_COMPANIES} />;
}
