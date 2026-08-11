"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/features/auth/actions";
import { DEFAULT_TIMEZONE_ID } from "@/features/auth/lib/timezones";
import {
  clearSignupDraft,
  readSignupDraft,
  type SignupDraft,
} from "@/features/auth/store/signup-draft";
import { OnboardingStepper } from "@/features/onboarding/components/onboarding-stepper";
import {
  StepBusinessHours,
  StepInviteTeam,
  StepSlaTargets,
  type OnboardingErrors,
  type OnboardingValues,
} from "@/features/onboarding/components/onboarding-steps";
import {
  DEFAULT_WORKING_DAYS,
  ONBOARDING_ORG_NAME,
  SEED_INVITE_EMAILS,
} from "@/features/onboarding/lib/onboarding-data";

/**
 * Three-step onboarding wizard, from `Update design.dc.html` → the `scrOnboarding` block,
 * `wizCard`, `wizSteps`, `wizNext` / `wizBack` / `wizNextLabel`.
 *
 * A real wizard, unlike /signup's static strip: the design drives every step body off
 * `s.wizard` (`wizIs1` / `wizIs2` / `wizIs3`) and its stepper entries are buttons.
 *
 * Measured: card 620px — wider than login/signup's 440 — 16px radius, 30px padding
 * (22/18 below md), 20px gap. Footer is unconditional in the design: Back, Skip for now
 * and Continue on every step, with the primary reading "Finish setup" on step 3.
 *
 * ALL steps are ONE route. Nothing here navigates between them.
 *
 * LIVE, and this is the end of the signup chain: "Finish setup" (and "Skip for now" on the
 * last step) sends every step's answers — steps 1 and 2 come out of the signup draft — to
 * `registerAction`, which creates the account and provisions the organization in one call.
 * Steps 1–3 still only edit local state; this is the single write.
 */

const LAST_STEP = 3;

/**
 * Seeded from the draft, so /create-org's timezone carries over and a refresh mid-wizard
 * doesn't reset the answers. Falls back to the design's own values when the draft is empty.
 */
function initialValues(draft: SignupDraft): OnboardingValues {
  return {
    timezone: draft.timezoneId || DEFAULT_TIMEZONE_ID,
    days: draft.workingDays.length > 0 ? draft.workingDays : DEFAULT_WORKING_DAYS,
    dayStart: draft.dayStart || "09:00",
    dayEnd: draft.dayEnd || "18:30",
    emails: draft.inviteEmails || SEED_INVITE_EMAILS,
    role: draft.inviteRole || "Agent",
  };
}

/** `INVITE_ROLES` labels → `public.membership_role` values. */
const ROLE_VALUES: Record<string, "agent" | "manager" | "billing_admin"> = {
  Agent: "agent",
  Manager: "manager",
  "Billing Admin": "billing_admin",
};

/** The design's comma-separated invite box → the payload's `{ email, role }` list. */
function parseInvites(emails: string, role: string) {
  const value = ROLE_VALUES[role] ?? "agent";

  return emails
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((email) => ({ email, role: value }));
}

/** 24-hour HH:MM. */
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function minutesOf(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

function validate(step: number, values: OnboardingValues): OnboardingErrors {
  const errors: OnboardingErrors = {};

  if (step === 1) {
    if (values.days.length === 0) errors.days = "Pick at least one working day";

    const startOk = TIME_PATTERN.test(values.dayStart.trim());
    const endOk = TIME_PATTERN.test(values.dayEnd.trim());
    if (!startOk || !endOk) errors.hours = "Use 24-hour times, like 09:00";
    else if (minutesOf(values.dayEnd.trim()) <= minutesOf(values.dayStart.trim()))
      errors.hours = "The day has to end after it starts";
  }

  // Step 2 is read-only in the design — there is nothing to validate.

  if (step === 3) {
    const entries = values.emails
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    // Inviting is optional — that is what "Skip for now" is for — so only shape is checked.
    const invalid = entries.filter((entry) => !EMAIL_PATTERN.test(entry));
    if (invalid.length > 0)
      errors.emails = `Check ${invalid.length === 1 ? "this address" : "these addresses"}: ${invalid.join(", ")}`;
  }

  return errors;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [draft] = React.useState(readSignupDraft);
  const [step, setStep] = React.useState(1);
  const [values, setValues] = React.useState<OnboardingValues>(() => initialValues(draft));
  const [errors, setErrors] = React.useState<OnboardingErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  /** Set once the org is provisioned but the account still needs its email confirmed. */
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);

  // Values live in the shell, so nothing is reset by moving between steps.
  const change = React.useCallback((patch: Partial<OnboardingValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  }, []);

  function goTo(next: number) {
    setErrors({});
    setStep(Math.min(LAST_STEP, Math.max(1, next)));
  }

  /**
   * The one write in the whole wizard. Steps 1–3 only edited local state; this sends every
   * step's answers — including /signup's and /create-org's, out of the draft — in a single
   * call, and the account plus the organization come into existence together or not at all.
   */
  async function finish({ withInvites }: { withInvites: boolean }) {
    setSubmitError(null);
    setIsPending(true);

    const payload = {
      fullName: draft.fullName,
      email: draft.email,
      password: draft.password,
      organizationName: draft.organizationName,
      portalSlug: draft.portalSlug,
      // From `values`, not the draft: onboarding step 1 offers the timezone again and its
      // answer is the later one.
      timezoneId: values.timezone,
      workingDays: values.days,
      dayStart: values.dayStart.trim(),
      dayEnd: values.dayEnd.trim(),
      // "Skip for now" bypasses this step's validation by design, so its addresses were
      // never checked — sending them would fail the schema server-side instead of skipping.
      inviteUsers: withInvites ? parseInvites(values.emails, values.role) : [],
    };

    let result;

    try {
      result = await registerAction(payload);
    } catch (error) {
      console.error("[onboarding] register request failed", error);
      setSubmitError("Network error. Check your connection and try again.");
      setIsPending(false);
      return;
    }

    if (!result.success) {
      setSubmitError(result.message);
      setIsPending(false);
      return;
    }

    // Only now is the password safe to drop — it has been spent.
    clearSignupDraft();

    if (result.data.requiresEmailConfirmation) {
      // The organization exists, but the project has "Confirm email" on, so there is no
      // session — sending them to the app would render a signed-out shell. Say so here
      // instead of navigating; the wizard is done either way.
      setConfirmationEmail(draft.email);
      setIsPending(false);
      return;
    }

    // `refresh()` first so the app shell renders against the session the action just set.
    router.refresh();
    router.replace("/");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Always intercept: the last step provisions via an action, not a native submit.
    event.preventDefault();

    const found = validate(step, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (step < LAST_STEP) {
      goTo(step + 1);
      return;
    }

    void finish({ withInvites: true });
  }

  function skip() {
    // Skipping bypasses this step's validation by design.
    setErrors({});

    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }

    // On the last step there is nothing further to skip TO, so this finishes setup without
    // the invite list rather than sitting inert as it did when nothing was provisioned.
    void finish({ withInvites: false });
  }

  if (confirmationEmail) {
    return (
      // Same card metrics as the wizard it replaces, so the panel doesn't jump.
      <div className="flex w-full max-w-[620px] flex-col gap-5 rounded-2xl border bg-card px-4.5 py-5.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-7.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-[0.1em] text-brand-accent uppercase">
            Setup complete
          </span>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
            Confirm your email to sign in.
          </h1>
          <p className="text-sm leading-[1.6] text-muted-foreground">
            {ONBOARDING_ORG_NAME} is set up — your organization, business hours and SLA targets are
            all saved. We sent a confirmation link to{" "}
            <span className="font-semibold text-foreground">{confirmationEmail}</span>. Open it,
            then sign in.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 border-t border-muted pt-4">
          <Button
            asChild
            className="h-10.5 bg-brand-accent px-5 font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    // 620px cap, 16px radius, 30px padding (22/18 below md), 20px gap — `wizCard`.
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full max-w-[620px] flex-col gap-5 rounded-2xl border bg-card px-4.5 py-5.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-7.5"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.1em] text-brand-accent uppercase">
          Set up {ONBOARDING_ORG_NAME}
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
          Three steps and your queue is live.
        </h1>
      </div>

      <OnboardingStepper currentStep={step} onStepSelect={goTo} />

      {/* Provisioning failures only — step validation still reports at field level. Matches
          the login card's error Alert: 10px radius, 12/14px padding. */}
      {submitError ? (
        <Alert tone="error" className="rounded-[10px] px-3.5 py-3">
          <CircleAlert className="size-[18px]" aria-hidden />
          <AlertDescription className="text-sm leading-[1.55]">
            <span className="font-bold">We couldn&apos;t finish setup.</span> {submitError}
          </AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? <StepBusinessHours values={values} errors={errors} onChange={change} /> : null}
      {step === 2 ? <StepSlaTargets /> : null}
      {step === 3 ? <StepInviteTeam values={values} errors={errors} onChange={change} /> : null}

      {/* Unconditional in the design — Back is present on every step. On step 1 there is a
          route behind this one, so it returns to /create-org rather than sitting inert. */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-muted pt-1">
        {step === 1 ? (
          <Button variant="quiet" asChild className="h-10.5 text-brand-accent">
            <Link href="/create-org">Back</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="quiet"
            onClick={() => goTo(step - 1)}
            className="h-10.5 text-brand-accent"
          >
            Back
          </Button>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="neutral"
            onClick={skip}
            disabled={isPending}
            className="h-10.5 border-input text-brand-accent"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="h-10.5 bg-brand-accent px-5 font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            {isPending ? "Setting up…" : step === LAST_STEP ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
