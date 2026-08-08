"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ORG } from "@/features/shell/lib/identity";

/**
 * Login card, transcribed from `Update design.dc.html` → `authCard` and the `scrLogin`
 * block, and measured against design-reference/log-in--light.png (1:1 at 1440).
 *
 * Measured: card 440px wide, 16px radius, 32px padding, 18px gap between blocks; fields
 * 42px tall with a 6px radius; both buttons 52px. Field metrics override the design
 * system's documented 40px — this screen renders 42px and the screen wins.
 *
 * VISUAL + CLIENT VALIDATION ONLY. There is no auth, no session, no server action. Submit
 * is intercepted, validated in React state, and then reports the design's own failure
 * copy so the error state is reachable; nothing is sent anywhere.
 */

/** The design's seeded values, so the screen renders as the capture does. */
const SEED_EMAIL = "sam@northwind.io";

/** Deliberately loose — this only has to reject obvious non-addresses client-side. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = {
  form?: string;
  email?: string;
  password?: string;
};

export function LoginForm() {
  const [email, setEmail] = React.useState(SEED_EMAIL);
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Never navigate: there is nothing to submit to yet.
    event.preventDefault();

    const next: Errors = {};
    if (!email.trim()) next.email = "Enter your work email";
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Enter your password";

    if (!next.email && !next.password) {
      // No credential check exists, so a well-formed submission lands on the design's
      // own failure copy. This is what makes the error state demonstrable.
      next.form = "Check your password, or reset it. Two attempts left before a 15-minute lock.";
      next.password = "Incorrect password";
    }

    setErrors(next);
  }

  return (
    // 440px cap, 16px radius, 32px padding (24/20 below md), 18px block gap.
    <AuthCard onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
          Sign in to {ORG.name}
        </h1>
        <p className="text-sm leading-[1.6] text-muted-foreground">
          Work your queue against live SLA targets.
        </p>
      </div>

      {/* 10px radius and 12/14px padding are this screen's own; the tone comes from the
          primitive. Only the radius/padding differ from the Alert default. */}
      {errors.form ? (
        <Alert tone="error" className="rounded-[10px] px-3.5 py-3">
          <CircleAlert className="size-[18px]" aria-hidden />
          <AlertDescription className="text-sm leading-[1.55]">
            <span className="font-bold">That email and password don&apos;t match.</span>{" "}
            {errors.form}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email" className="font-semibold text-foreground">
            Work email
          </Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@northwind.io"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            // 42px measured on this screen, 44px touch floor below md; 6px radius.
            className="h-11 rounded-sm text-sm md:h-10.5"
          />
          {/* The design replaces the hint with the error rather than stacking them. */}
          {errors.email ? (
            <p id="login-email-error" className="text-sm text-destructive-strong">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password" className="font-semibold text-foreground">
            Password
          </Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className="h-11 rounded-sm text-sm md:h-10.5"
          />
          {errors.password ? (
            <p id="login-password-error" className="text-sm text-destructive-strong">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Checkbox id="login-remember" name="remember" className="size-[18px] rounded-[5px]" />
            <Label htmlFor="login-remember" className="text-sm font-normal text-foreground">
              Keep me signed in
            </Label>
          </div>
          {/* Built in a later phase — the link renders and 404s for now. */}
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* 52px measured; the design's `lg` button with a full-width `fullBtn` override. */}
        <Button
          type="submit"
          className="h-13 w-full bg-brand-accent text-base font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          Sign in
        </Button>

        <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Social login, inert: no provider, no OAuth, no handler in this pass. */}
        <Button
          type="button"
          variant="neutral"
          className="h-13 w-full border-input text-base text-brand-accent"
        >
          Continue with Google
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New here? {/* Built in a later phase — the link renders and 404s for now. */}
        <Link href="/signup" className="font-semibold text-brand-accent hover:underline">
          Create an organization
        </Link>
      </p>
    </AuthCard>
  );
}
