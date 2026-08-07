import type { Metadata } from "next";
import { TokenBoard } from "@/features/token-audit/components/token-board";

export const metadata: Metadata = {
  title: "Token board",
  description:
    "Resolved token layer diffed against Design System.dc.html, plus stock shadcn primitives inheriting it.",
  robots: { index: false, follow: false },
};

export default function TokensPage() {
  return <TokenBoard />;
}
