"use client";

import { STEP_LABELS } from "@/features/onboarding/lib/onboarding-data";
import { cn } from "@/lib/utils";

/**
 * Numbered stepper for the onboarding wizard, from `Update design.dc.html` → `wizSteps`.
 *
 * Unlike /signup's strip, this one is genuinely state-driven: the design computes
 * `done: s.wizard > x.n`, `active: s.wizard === x.n` and both style objects from `s.wizard`,
 * and wraps each step in a `<button onClick={w.go}>` — so the steps are navigable, not
 * decorative. Reproduced with real `currentStep` state and real handlers.
 *
 * Measured: 28px circles, 14px labels, 14px padding and gap on a `--background` strip with
 * a 14px radius.
 *
 * Status never rides on colour alone: each circle carries its number, each step its label,
 * the current one is marked `aria-current="step"`, and completed steps say so in an
 * `sr-only` suffix.
 */
export function OnboardingStepper({
  currentStep,
  onStepSelect,
  className,
}: {
  currentStep: number;
  onStepSelect: (step: number) => void;
  className?: string;
}) {
  return (
    <ol
      aria-label="Setup progress"
      className={cn(
        "flex list-none flex-wrap items-center gap-3.5 rounded-xl border bg-background p-3.5",
        className,
      )}
    >
      {STEP_LABELS.map((label, index) => {
        const n = index + 1;
        const reached = currentStep >= n;
        const isCurrent = currentStep === n;
        return (
          <li key={label} aria-current={isCurrent ? "step" : undefined}>
            <button
              type="button"
              onClick={() => onStepSelect(n)}
              className="flex items-center gap-2 rounded-md p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {/* 28px circle, 12px/700 numeral. */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  reached
                    ? "bg-brand-accent text-brand-accent-foreground"
                    : "bg-border text-muted-foreground",
                )}
              >
                {n}
              </span>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  isCurrent ? "font-bold text-foreground" : "font-medium text-muted-foreground",
                )}
              >
                {label}
              </span>
              <span className="sr-only">
                {isCurrent ? "— current step" : reached ? "— done" : "— not started"}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
