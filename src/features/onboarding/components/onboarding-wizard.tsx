"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEFAULT_TIMEZONE_ID } from "@/features/auth/lib/timezones";
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
  SEED_INVITE_EMAILS,
} from "@/features/onboarding/lib/onboarding-data";
import { ORG } from "@/features/shell/lib/identity";

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
 * ALL steps are ONE route. Nothing here navigates between them, and nothing is provisioned:
 * "Finish setup" preventDefaults and stops.
 */

const LAST_STEP = 3;

const INITIAL_VALUES: OnboardingValues = {
  timezone: DEFAULT_TIMEZONE_ID,
  days: DEFAULT_WORKING_DAYS,
  dayStart: "09:00",
  dayEnd: "18:30",
  emails: SEED_INVITE_EMAILS,
  role: "Agent",
};

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
  const [step, setStep] = React.useState(1);
  const [values, setValues] = React.useState<OnboardingValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<OnboardingErrors>({});

  // Values live in the shell, so nothing is reset by moving between steps.
  const change = React.useCallback((patch: Partial<OnboardingValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  }, []);

  function goTo(next: number) {
    setErrors({});
    setStep(Math.min(LAST_STEP, Math.max(1, next)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Never navigate: nothing is provisioned in this pass.
    event.preventDefault();

    const found = validate(step, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // On the last step the design goes to the queue; there is no session to go there with.
    if (step < LAST_STEP) goTo(step + 1);
  }

  function skip() {
    // Skipping bypasses this step's validation by design.
    setErrors({});
    if (step < LAST_STEP) setStep(step + 1);
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
          Set up {ORG.name}
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
          Three steps and your queue is live.
        </h1>
      </div>

      <OnboardingStepper currentStep={step} onStepSelect={goTo} />

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
            className="h-10.5 border-input text-brand-accent"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            className="h-10.5 bg-brand-accent px-5 font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            {step === LAST_STEP ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
