import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your ServiceDesk Pro account.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: false },
};

/**
 * Unauthenticated route, `(auth)` group — no sidebar, no top bar, no content container.
 * The design calls this route `forgot`; the URL is `/forgot-password`, which is what
 * login already links to.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
