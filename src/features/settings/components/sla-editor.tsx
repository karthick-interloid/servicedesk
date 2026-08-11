"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { WORKING_DAYS } from "@/features/onboarding/lib/onboarding-data";
import { cn } from "@/lib/utils";

import { DURATION_ERROR, parseDuration } from "../lib/duration";
import { MOCK_BUSINESS_HOURS, businessHoursLabel, findBusinessHours } from "../lib/mock-sla";
import { SLA_STATUS_TONE, type SlaAppliesTo, type SlaPolicy, type SlaStatus } from "../types";

/* ---------------------------------------------------------------------------
   PRESENTATIONAL ONLY — NOTHING PERSISTS. Save validates, then navigates back to the
   list; the mock module is never mutated, so the list still shows the original values.

   PRIMITIVE CONSTRAINT (carried forward from SIGNUP-DIFF §C and ONBOARDING-DIFF):
   `SelectTrigger` sets its own height with `data-[size=default]:h-8`, an attribute-
   qualified rule that outranks a plain height class. Every select below therefore uses the
   important modifier to reach the design's 42px. `ui/select.tsx` is NOT edited.
   --------------------------------------------------------------------------- */
const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";
const SELECT_CLASS = "h-11! w-full rounded-sm text-sm md:h-10.5!";

/** `twoCol`: one column below lg, two at lg and up. */
const TWO_COL = "grid grid-cols-1 gap-4 lg:grid-cols-2";

/** The design's section captions: 12px / 700 / .05em caps. */
const SECTION = "text-xs font-bold tracking-[0.05em] text-muted-foreground/80 uppercase";

const STATUSES: SlaStatus[] = ["Active", "Paused", "Draft"];
const APPLIES_TO: SlaAppliesTo[] = [
  "Business & Enterprise customers",
  "All customers",
  "Urgent tickets only",
];

type TargetErrors = { firstResponse?: string; resolution?: string };
type Errors = { name?: string; targets: Record<string, TargetErrors> };

export function SlaEditor({ policy, mode }: { policy: SlaPolicy; mode: "new" | "edit" }) {
  const router = useRouter();

  const [draft, setDraft] = useState<SlaPolicy>(policy);
  const [errors, setErrors] = useState<Errors>({ targets: {} });

  const hours = findBusinessHours(draft.businessHoursId) ?? MOCK_BUSINESS_HOURS[0]!;
  const [days, setDays] = useState<string[]>(hours.days);

  const setTarget = (scope: string, field: "firstResponse" | "resolution", value: string) =>
    setDraft((prev) => ({
      ...prev,
      targets: prev.targets.map((t) => (t.scope === scope ? { ...t, [field]: value } : t)),
    }));

  /**
   * Client-side only. Three rules:
   *   · the name is required
   *   · every duration must parse (positive integer + unit)
   *   · resolution must be at least first response — the design says targets are a
   *     response THEN a resolution, so the reverse is incoherent
   */
  const validate = (): boolean => {
    const next: Errors = { targets: {} };

    if (draft.name.trim().length === 0) {
      next.name = "Give this policy a name.";
    }

    for (const target of draft.targets) {
      const first = parseDuration(target.firstResponse);
      const resolution = parseDuration(target.resolution);
      const rowErrors: TargetErrors = {};

      if (!first) rowErrors.firstResponse = DURATION_ERROR;
      if (!resolution) rowErrors.resolution = DURATION_ERROR;

      if (first && resolution && resolution.minutes < first.minutes) {
        rowErrors.resolution = "Resolution must be at least the first-response target.";
      }

      if (Object.keys(rowErrors).length > 0) next.targets[target.scope] = rowErrors;
    }

    setErrors(next);
    return !next.name && Object.keys(next.targets).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    // No persistence — see the header note. The design's own `saveSla` only fires a toast
    // and returns to the list, which is what this reproduces.
    router.push("/settings/sla");
  };

  return (
    <div className="flex flex-col gap-3.5">
      <Link
        href="/settings/sla"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand-accent"
      >
        <ChevronLeft className="size-4" aria-hidden />
        SLA policies
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "new" ? "New SLA policy" : draft.name || "Untitled policy"}
        </h1>
        <Badge tone={SLA_STATUS_TONE[draft.status]} dot>
          {draft.status}
        </Badge>
      </div>

      {/* The design's single form card: 1px border, radius 14, 16px padding, 16px gap. */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-4">
        <div className={TWO_COL}>
          <Field
            id="sla-name"
            label="Policy name"
            error={errors.name}
            control={
              <Input
                id="sla-name"
                className={FIELD_CLASS}
                placeholder="e.g. Priority support"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                aria-invalid={Boolean(errors.name)}
              />
            }
          />

          {/* ⚠ `status` has no column — see ../types.ts. */}
          <Field
            id="sla-status"
            label="Status"
            hint="Draft policies don't run countdowns yet."
            control={
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft((p) => ({ ...p, status: v as SlaStatus }))}
              >
                <SelectTrigger id="sla-status" className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </div>

        <div className={TWO_COL}>
          <Field
            id="sla-hours"
            label="Business hours"
            control={
              <Select
                value={draft.businessHoursId}
                onValueChange={(v) => {
                  setDraft((p) => ({ ...p, businessHoursId: v }));
                  setDays(findBusinessHours(v)?.days ?? []);
                }}
              >
                <SelectTrigger id="sla-hours" className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_BUSINESS_HOURS.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {businessHoursLabel(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />

          {/* ⚠ `appliesTo` has no column — see ../types.ts. */}
          <Field
            id="sla-applies"
            label="Applies to"
            control={
              <Select
                value={draft.appliesTo}
                onValueChange={(v) => setDraft((p) => ({ ...p, appliesTo: v as SlaAppliesTo }))}
              >
                <SelectTrigger id="sla-applies" className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLIES_TO.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </div>

        <Divider />
        <span className={SECTION}>Targets by priority</span>

        <div className="flex flex-col gap-3">
          {draft.targets.map((target) => {
            const rowErrors = errors.targets[target.scope] ?? {};
            return (
              /* `slaRowStyle`: one column below lg, `120px 1fr 1fr` above.
                 The design sets `align-items: end`, which is indistinguishable from `start`
                 for every state it draws — both cells are label + input, so they are the
                 same height. It only diverges once a validation message (which the design
                 never draws) makes one cell taller: `end` then drops the paired field down
                 beside the NEXT priority's row, which reads as belonging to the wrong
                 priority. `start` keeps the two inputs level and lets the message hang
                 below, so it is used here. */
              <div
                key={target.scope}
                className="grid grid-cols-1 gap-3 lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
              >
                {/* Same pill as onboarding step 2 and the queue — tone + dot + the word.
                    Offset by the label row (20px + 6px gap) and centred against the 42px
                    field, so it still sits level with the inputs as the design shows. */}
                <span className="lg:mt-6.5 lg:flex lg:h-10.5 lg:items-center">
                  <Badge tone={target.tone} dot>
                    {target.label}
                  </Badge>
                </span>

                <Field
                  id={`sla-${target.scope}-first`}
                  label="First response"
                  error={rowErrors.firstResponse}
                  control={
                    <Input
                      id={`sla-${target.scope}-first`}
                      className={FIELD_CLASS}
                      value={target.firstResponse}
                      onChange={(e) => setTarget(target.scope, "firstResponse", e.target.value)}
                      aria-invalid={Boolean(rowErrors.firstResponse)}
                    />
                  }
                />
                <Field
                  id={`sla-${target.scope}-resolution`}
                  label="Resolution"
                  error={rowErrors.resolution}
                  control={
                    <Input
                      id={`sla-${target.scope}-resolution`}
                      className={FIELD_CLASS}
                      value={target.resolution}
                      onChange={(e) => setTarget(target.scope, "resolution", e.target.value)}
                      aria-invalid={Boolean(rowErrors.resolution)}
                    />
                  }
                />
              </div>
            );
          })}
        </div>

        <Divider />
        <span className={SECTION}>Business hours calendar</span>

        {/* Same 52×36 toggles onboarding step 1 uses — not a second day-picker treatment. */}
        <div role="group" aria-label="Working days" className="flex flex-wrap gap-2">
          {WORKING_DAYS.map((day) => (
            <Toggle
              key={day}
              variant="outline"
              pressed={days.includes(day)}
              onPressedChange={(next) =>
                setDays((prev) => (next ? [...prev, day] : prev.filter((d) => d !== day)))
              }
              aria-label={day}
              className={cn(
                "h-9 min-w-13 rounded-lg px-0 text-sm font-semibold",
                "data-[state=off]:border-border data-[state=off]:bg-card data-[state=off]:text-muted-foreground/80",
                "data-[state=on]:border-brand-accent! data-[state=on]:bg-accent! data-[state=on]:text-brand-accent!",
              )}
            >
              {day}
            </Toggle>
          ))}
        </div>

        <div className={TWO_COL}>
          <Field
            id="sla-day-start"
            label="Day starts"
            control={
              <Input
                id="sla-day-start"
                className={FIELD_CLASS}
                inputMode="numeric"
                defaultValue={hours.dayStart}
              />
            }
          />
          <Field
            id="sla-day-end"
            label="Day ends"
            control={
              <Input
                id="sla-day-end"
                className={FIELD_CLASS}
                inputMode="numeric"
                defaultValue={hours.dayEnd}
              />
            }
          />
        </div>

        <span className={SECTION}>Holidays (SLA pauses)</span>
        {/* Read-only in the design: rows of text with no control and no add affordance. */}
        <div className="overflow-hidden rounded-[10px] border border-border">
          {hours.holidays.length > 0 ? (
            hours.holidays.map((holiday, index) => (
              <div
                key={holiday}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-secondary-foreground",
                  index > 0 && "border-t border-muted",
                )}
              >
                {holiday}
              </div>
            ))
          ) : (
            <div className="px-3.5 py-2.5 text-sm text-muted-foreground">
              No holidays on this calendar.
            </div>
          )}
        </div>

        <Divider />

        {/* ⚠ Neither switch has a column — see ../types.ts. */}
        <SwitchRow
          id="sla-notify"
          label="Notify assignee 15 minutes before breach"
          checked={draft.notifyBeforeBreach}
          onChange={(v) => setDraft((p) => ({ ...p, notifyBeforeBreach: v }))}
        />
        <SwitchRow
          id="sla-escalate"
          label="Escalate to manager on breach"
          checked={draft.escalateOnBreach}
          onChange={(v) => setDraft((p) => ({ ...p, escalateOnBreach: v }))}
        />

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button variant="neutral" size="touch" asChild>
            <Link href="/settings/sla">Cancel</Link>
          </Button>
          <Button
            size="touch"
            onClick={save}
            className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            {mode === "new" ? "Create policy" : "Save policy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The design's 1px `#F1F5F9` rules between sections. */
function Divider() {
  return <div className="h-px bg-muted" aria-hidden />;
}

/**
 * Label + control + hint/error, in the auth convention: the error REPLACES the hint rather
 * than stacking under it, so the field never grows a third line.
 */
function Field({
  id,
  label,
  control,
  hint,
  error,
}: {
  id: string;
  label: string;
  control: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="font-semibold text-foreground">
        {label}
      </Label>
      {control}
      {error ? (
        <p className="text-sm text-destructive-strong">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm font-normal text-foreground">
        {label}
      </Label>
    </div>
  );
}
