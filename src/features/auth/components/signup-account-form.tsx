"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignupStepper } from "@/features/auth/components/signup-stepper";

/**
 * DESIGN-AUTHORED. `Update design.dc.html` has no "Your account" step — confirmed absent in
 * SIGNUP-DIFF §0 — so nothing here is transcribed and there is no capture to diff against.
 * Every visual value is inherited from a screen that IS design-derived: the card, stepper
 * and field metrics come from the create-org screen, the CTA from its left-aligned
 * Continue. See docs/SIGNUP-ACCOUNT-DIFF.md for the provenance of each one.
 *
 * VISUAL + CLIENT VALIDATION ONLY. No account, no session, no hashing, no storage. On
 * all-valid Continue the router moves to /create-org, which is a real route transition —
 * unlike the onboarding wizard's in-page steps.
 */

/** Stated in the Password hint so the rule and the copy cannot drift apart. */
const MIN_PASSWORD_LENGTH = 8;

/** Deliberately loose — this only has to reject obvious non-addresses client-side. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Matches the field metrics measured on login and create-org: 42px, 6px radius. */
const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";

type Errors = {
  email?: string;
  password?: string;
  confirm?: string;
};

export function SignupAccountForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) next.email = "Enter your email address";
    else if (!EMAIL_PATTERN.test(trimmedEmail)) next.email = "Enter a valid email address";

    if (!password) next.password = "Enter a password";
    else if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;

    if (!confirm) next.confirm = "Re-enter your password";
    else if (confirm !== password) next.confirm = "Passwords don't match";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Nothing is created — this only advances the flow to the next route.
    router.push("/create-org");
  }

  return (
    // Inherited verbatim from create-org / login: 440px cap, 16px radius, 32px padding
    // (24/20 below md), 18px block gap.
    <AuthCard onSubmit={handleSubmit}>
      <SignupStepper currentStep={1} />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.1em] text-brand-accent uppercase">
          Step 1 of 4
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
          Create your account
        </h1>
        <p className="text-sm leading-[1.6] text-muted-foreground">
          This is the login you&rsquo;ll use to work your queue.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-email" className="font-semibold text-foreground">
          Email address
        </Label>
        <Input
          id="account-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "account-email-error" : "account-email-hint"}
          className={FIELD_CLASS}
        />
        {/* Error replaces the hint rather than stacking with it. */}
        {errors.email ? (
          <p id="account-email-error" className="text-sm text-destructive-strong">
            {errors.email}
          </p>
        ) : (
          <p id="account-email-hint" className="text-sm text-muted-foreground">
            Use your work address — invites and alerts go here.
          </p>
        )}
      </div>

      <PasswordField
        id="account-password"
        label="Password"
        autoComplete="new-password"
        value={password}
        onValueChange={setPassword}
        revealed={showPassword}
        onToggleReveal={() => setShowPassword((current) => !current)}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />

      <PasswordField
        id="account-confirm"
        label="Confirm password"
        autoComplete="new-password"
        value={confirm}
        onValueChange={setConfirm}
        revealed={showConfirm}
        onToggleReveal={() => setShowConfirm((current) => !current)}
        error={errors.confirm}
        hint="Type it once more so we know it&rsquo;s right."
      />

      {/* Left-aligned and auto-width, matching create-org's Continue — the sibling this
          screen precedes — rather than login's full-width CTA. */}
      <div className="flex gap-2.5">
        <Button
          type="submit"
          className="h-13 bg-brand-accent px-5 text-base font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          Continue
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

/**
 * Password input with a reveal toggle on the trailing edge. `InputGroup` supplies the
 * bordered wrapper and a transparent control, so the field keeps the same 42px height,
 * 6px radius and `--input` border as the plain inputs beside it — the toggle sits inside
 * the field rather than beside it.
 */
function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onValueChange,
  revealed,
  onToggleReveal,
  error,
  hint,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onValueChange: (value: string) => void;
  revealed: boolean;
  onToggleReveal: () => void;
  error?: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="font-semibold text-foreground">
        {label}
      </Label>
      {/* InputGroup's own `h-8` and `rounded-lg` are plain classes, so these merge over
          them without needing an important modifier. */}
      <InputGroup className={FIELD_CLASS}>
        <InputGroupInput
          id={id}
          name={id}
          type={revealed ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className="text-sm"
        />
        <InputGroupAddon align="inline-end" className="pr-2">
          <InputGroupButton
            size="icon-xs"
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
            onClick={onToggleReveal}
          >
            {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive-strong">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
