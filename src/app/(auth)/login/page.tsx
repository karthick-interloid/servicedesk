import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your ServiceDesk Pro workspace.",
  alternates: { canonical: "/login" },
  // Nothing here should be indexed once it fronts a real session.
  robots: { index: false, follow: false },
};

/**
 * Unauthenticated route. It sits in the (auth) group precisely so it inherits none of the
 * (app) shell — no sidebar, no top bar, no content container.
 *
 * Container is the design's `authPad`: a centred single column, 22px between the logo row
 * and the card, 56px/24px padding at md and up and 28px/20px below it.
 */
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
