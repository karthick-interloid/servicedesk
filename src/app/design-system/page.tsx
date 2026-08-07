import type { Metadata } from "next";
import { DocLayout } from "@/features/design-system/components/doc-shell";
import { Part01 } from "@/features/design-system/components/part-01";
import { Part02 } from "@/features/design-system/components/part-02";
import { Part03 } from "@/features/design-system/components/part-03";
import { Part04 } from "@/features/design-system/components/part-04";

export const metadata: Metadata = {
  title: "Design system",
  description:
    "Every token, primitive, and pattern used across the ServiceDesk Pro screens, with the shadcn/ui token name for each.",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <DocLayout>
      <Part01 />
      <Part02 />
      <Part03 />
      <Part04 />
    </DocLayout>
  );
}
