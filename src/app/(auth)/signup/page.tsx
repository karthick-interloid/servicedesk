import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-card";
import { SignupAccountForm } from "@/features/auth/components/signup-account-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Step one of setting up your ServiceDesk Pro workspace.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

/**
 * Step 1 of 4 in the signup flow: /signup → /create-org → /onboarding.
 *
 * DESIGN-AUTHORED — there is no capture for this screen. The container is the same
 * `authPad` treatment as /login and /create-org so the flow reads as one piece.
 */
export default function SignupPage() {
  return (
    <AuthShell>
      <SignupAccountForm />
    </AuthShell>
  );
}
