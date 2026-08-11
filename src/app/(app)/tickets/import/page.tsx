import type { Metadata } from "next";

import { CsvImport } from "@/features/tickets/components/csv-import";

export const metadata: Metadata = {
  title: "Import tickets",
  alternates: { canonical: "/tickets/import" },
  robots: { index: false, follow: false },
};

/**
 * CSV import.
 *
 * No server read to do — the wizard's input is a file the user picks, and both server steps
 * (dry run, then import) are Server Actions. So this page is a thin mount and the whole
 * screen is the client component.
 */
export default function ImportTicketsPage() {
  return <CsvImport />;
}
