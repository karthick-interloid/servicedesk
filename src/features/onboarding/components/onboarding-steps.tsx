"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { TIMEZONES, timezoneHint } from "@/features/auth/lib/timezones";
import { INVITE_ROLES, SLA_TARGETS, WORKING_DAYS } from "@/features/onboarding/lib/onboarding-data";
import { cn } from "@/lib/utils";

/**
 * The three step bodies. Kept thin — all state lives in the wizard shell.
 *
 * PRIMITIVE CONSTRAINT (carried forward from SIGNUP-DIFF §C): `SelectTrigger` sets its own
 * height with `data-[size=default]:h-8`, an attribute-qualified rule that outranks a plain
 * height class. Both selects below therefore use the important modifier to reach the
 * design's 42px. `ui/select.tsx` is not edited.
 */

export type OnboardingValues = {
  timezone: string;
  days: string[];
  dayStart: string;
  dayEnd: string;
  emails: string;
  role: string;
};

export type OnboardingErrors = Partial<Record<"days" | "hours" | "emails", string>>;

const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";
const SELECT_CLASS = "h-11! w-full rounded-sm text-sm md:h-10.5!";

function StepHeading({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {blurb ? <p className="text-sm leading-[1.6] text-muted-foreground">{blurb}</p> : null}
    </div>
  );
}

export function StepBusinessHours({
  values,
  errors,
  onChange,
}: {
  values: OnboardingValues;
  errors: OnboardingErrors;
  onChange: (patch: Partial<OnboardingValues>) => void;
}) {
  function toggleDay(day: string, pressed: boolean) {
    onChange({
      days: pressed ? [...values.days, day] : values.days.filter((existing) => existing !== day),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="When is your team on shift?" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="onboarding-timezone" className="font-semibold text-foreground">
          Time zone
        </Label>
        <Select value={values.timezone} onValueChange={(timezone) => onChange({ timezone })}>
          <SelectTrigger id="onboarding-timezone" className={SELECT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{timezoneHint(values.timezone)}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <span id="working-days-label" className="text-sm font-semibold text-foreground">
          Working days
        </span>
        {/* Seven independent toggles, 52×36 with an 8px radius. The selected fill is the
            design's shade(accent,.92) = #ECF4F3, which has no token; --accent (#E7F1F1) is
            the nearest and is used here. `!` is load-bearing: Toggle's own base string
            carries `data-[state=on]:bg-muted`, which would otherwise tie and win. */}
        <div role="group" aria-labelledby="working-days-label" className="flex flex-wrap gap-2">
          {WORKING_DAYS.map((day) => {
            const pressed = values.days.includes(day);
            return (
              <Toggle
                key={day}
                variant="outline"
                pressed={pressed}
                onPressedChange={(next) => toggleDay(day, next)}
                aria-label={day}
                className={cn(
                  "h-9 min-w-13 rounded-lg px-0 text-sm font-semibold",
                  "data-[state=off]:border-border data-[state=off]:bg-card data-[state=off]:text-muted-foreground/80",
                  "data-[state=on]:border-brand-accent! data-[state=on]:bg-accent! data-[state=on]:text-brand-accent!",
                )}
              >
                {day}
              </Toggle>
            );
          })}
        </div>
        {errors.days ? <p className="text-sm text-destructive-strong">{errors.days}</p> : null}
      </div>

      {/* The design's `twoCol`: one column below lg, two at lg and up. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-day-start" className="font-semibold text-foreground">
            Day starts
          </Label>
          <Input
            id="onboarding-day-start"
            inputMode="numeric"
            placeholder="09:00"
            value={values.dayStart}
            onChange={(event) => onChange({ dayStart: event.target.value })}
            aria-invalid={Boolean(errors.hours)}
            className={FIELD_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboarding-day-end" className="font-semibold text-foreground">
            Day ends
          </Label>
          <Input
            id="onboarding-day-end"
            inputMode="numeric"
            placeholder="18:30"
            value={values.dayEnd}
            onChange={(event) => onChange({ dayEnd: event.target.value })}
            aria-invalid={Boolean(errors.hours)}
            className={FIELD_CLASS}
          />
        </div>
        {errors.hours ? (
          <p className="text-sm text-destructive-strong lg:col-span-2">{errors.hours}</p>
        ) : null}
      </div>
    </div>
  );
}

export function StepSlaTargets() {
  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        title="Set your first SLA targets"
        blurb="Targets run on business hours. You can add more policies later."
      />

      {/* Read-only: the design's `wizIs2` body contains no editable control. */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {SLA_TARGETS.map((target, index) => (
          <div
            key={target.priority}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5",
              index > 0 && "border-t border-muted",
            )}
          >
            {/* Tone plus text, never tone alone — the priority is spelled out in the pill. */}
            <Badge tone={target.tone} dot>
              {target.priority}
            </Badge>
            <div className="flex flex-wrap gap-4 text-sm text-secondary-foreground">
              <span>
                First reply{" "}
                <strong className="font-semibold text-foreground">{target.firstReply}</strong>
              </span>
              <span>
                Resolve <strong className="font-semibold text-foreground">{target.resolve}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepInviteTeam({
  values,
  errors,
  onChange,
}: {
  values: OnboardingValues;
  errors: OnboardingErrors;
  onChange: (patch: Partial<OnboardingValues>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeading
        title="Invite your agents"
        blurb="Your Free plan covers 2 seats. Add more any time from Billing."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="onboarding-emails" className="font-semibold text-foreground">
          Email addresses
        </Label>
        <Input
          id="onboarding-emails"
          value={values.emails}
          onChange={(event) => onChange({ emails: event.target.value })}
          aria-invalid={Boolean(errors.emails)}
          aria-describedby={errors.emails ? "onboarding-emails-error" : "onboarding-emails-hint"}
          className={FIELD_CLASS}
        />
        {/* Error replaces the hint rather than stacking with it. */}
        {errors.emails ? (
          <p id="onboarding-emails-error" className="text-sm text-destructive-strong">
            {errors.emails}
          </p>
        ) : (
          <p id="onboarding-emails-hint" className="text-sm text-muted-foreground">
            Separate with commas
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="onboarding-role" className="font-semibold text-foreground">
          Invite as
        </Label>
        <Select value={values.role} onValueChange={(role) => onChange({ role })}>
          <SelectTrigger id="onboarding-role" className={SELECT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITE_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
