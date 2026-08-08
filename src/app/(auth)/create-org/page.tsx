import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-card";
import { CreateOrgForm } from "@/features/auth/components/create-org-form";

export const metadata: Metadata = {
  title: "Create organization",
  description: "Set up your ServiceDesk Pro workspace.",
  alternates: { canonical: "/create-org" },
  robots: { index: false, follow: false },
};

/**
 * Unauthenticated route, `(auth)` group — no sidebar, no top bar, no content container.
 * Same `authPad` container as /login: centred single column, 22px between the logo row and
 * the card, 56/24px padding at md and up and 28/20px below it.
 */
export default function CreateOrgPage() {
  return (
    <AuthShell>
      <CreateOrgForm />
    </AuthShell>
  );
}
