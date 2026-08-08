import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  alternates: {
    canonical: "/",
  },
};

export default function DashboardPage() {
  return (
    <h1 className="text-2xl font-bold tracking-tight text-balance">Dashboard — coming soon</h1>
  );
}
