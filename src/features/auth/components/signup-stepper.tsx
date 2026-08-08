import { cn } from "@/lib/utils";

/**
 * The four-step progress strip on `Create your organization`, from
 * `Update design.dc.html` → `orgSteps` / `ORG_STEPS`.
 *
 * It is a STATUS INDICATOR, not a control. The design's own `orgSteps` hardcodes
 * `background: x.n <= 2 ? accent : grey` and `fontWeight: x.n === 2 ? 700 : 500` — literal
 * comparisons against no state — because the flow it describes spans separate routes
 * (login → create-org → onboarding), not steps within this card. `currentStep` is exposed
 * so it stays honest if that ever changes, but nothing here navigates.
 *
 * Status never rides on colour alone: each circle carries its own number and every step
 * carries its label, and the current step is additionally marked for assistive tech with
 * `aria-current`.
 */

export type SignupStep = {
  n: number;
  label: string;
};

/** Verbatim from the design's `ORG_STEPS`. */
export const SIGNUP_STEPS: SignupStep[] = [
  { n: 1, label: "Your account" },
  { n: 2, label: "Organization" },
  { n: 3, label: "Business hours" },
  { n: 4, label: "Invite team" },
];

export function SignupStepper({
  currentStep,
  className,
}: {
  currentStep: number;
  className?: string;
}) {
  return (
    // 12/14px padding, 12px row gap · 16px column gap, 14px radius, --background fill.
    // It wraps to two rows inside the 440px card, exactly as the capture shows.
    <ol
      aria-label="Setup progress"
      className={cn(
        "flex list-none flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-background px-3.5 py-3",
        className,
      )}
    >
      {SIGNUP_STEPS.map((step) => {
        const reached = step.n <= currentStep;
        const isCurrent = step.n === currentStep;
        return (
          <li
            key={step.n}
            aria-current={isCurrent ? "step" : undefined}
            className="flex items-center gap-2"
          >
            {/* 26px circle, 12px/700 numeral. */}
            <span
              className={cn(
                "flex size-[26px] shrink-0 items-center justify-center rounded-full text-xs font-bold",
                reached
                  ? "bg-brand-accent text-brand-accent-foreground"
                  : "bg-border text-muted-foreground",
              )}
            >
              {step.n}
            </span>
            <span
              className={cn(
                "text-xs whitespace-nowrap",
                isCurrent ? "font-bold text-foreground" : "font-medium text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            <span className="sr-only">
              {isCurrent ? "— current step" : reached ? "— done" : "— not started"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
