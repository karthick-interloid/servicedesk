import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-card";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set up your workspace",
  description: "Business hours, SLA targets and your first invites.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
};

/**
 * Unauthenticated route, `(auth)` group — no sidebar, no top bar, no content container.
 *
 * Shares `AuthShell` (the design's `authPad`) with the other auth routes; only the card
 * inside differs, because the wizard uses the design's wider `wizCard` (620px) rather than
 * `authCard` (440px).
 */
export default function OnboardingPage() {
  return (
    <AuthShell>
      <OnboardingWizard />
    </AuthShell>
  );
}
