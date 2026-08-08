"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignupStepper } from "@/features/auth/components/signup-stepper";
import { DEFAULT_TIMEZONE_ID, TIMEZONES, timezoneHint } from "@/features/auth/lib/timezones";

/**
 * "Create your organization", transcribed from `Update design.dc.html` → the `scrCreateOrg`
 * block, and measured against design-reference/create-organization--light.png (1:1 at 1440).
 *
 * This is ONE card with THREE fields, not a wizard: the design's `<sc-if scrCreateOrg>` has
 * a single body, no step state and no Back control. The four-step strip above it is a
 * static progress indicator for a flow that spans routes. See docs/SIGNUP-DIFF.md.
 *
 * Measured: card 440px · 16px radius · 32px padding · 18px gap; fields 42px with a 6px
 * radius; Continue 112×52 and LEFT-ALIGNED, not full-width as on login.
 *
 * Step 2 of 4: /signup → /create-org → /onboarding. On valid input Continue advances to
 * /onboarding, which is a real route transition — the four steps are separate routes, not
 * in-page state.
 *
 * VISUAL + CLIENT VALIDATION ONLY. Nothing is provisioned — no org record, no session, no
 * server action. Advancing is the only side effect.
 */

/** The design's seeded values, so the screen renders as the capture does. */
const SEED_NAME = "Northwind Support";
const SEED_SLUG = "northwind";

/** The design's own taken-slug copy, kept so the error state matches the capture. */
const TAKEN_SLUG = "northwind";

/** Lowercase alphanumerics and inner hyphens — what a subdomain label allows. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Errors = {
  name?: string;
  slug?: string;
};

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = React.useState(SEED_NAME);
  const [slug, setSlug] = React.useState(SEED_SLUG);
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE_ID);
  const [errors, setErrors] = React.useState<Errors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Intercepted so the browser never posts — advancing is done by the router below.
    event.preventDefault();

    const next: Errors = {};
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();

    if (!trimmedName) next.name = "Enter an organization name";

    if (!trimmedSlug) next.slug = "Enter a portal address";
    else if (!SLUG_PATTERN.test(trimmedSlug))
      next.slug = "Use lowercase letters, numbers and hyphens only";
    else if (trimmedSlug === TAKEN_SLUG)
      // No registry exists, so the design's seeded address stands in for a taken one —
      // this is what makes the error state reachable through the UI.
      next.slug = `That address is taken. Try ${trimmedSlug}-support.`;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Nothing is created — this only advances the flow to the next route.
    router.push("/onboarding");
  }

  return (
    // 440px cap, 16px radius, 32px padding (24/20 below md), 18px block gap — `authCard`.
    <AuthCard onSubmit={handleSubmit}>
      <SignupStepper currentStep={2} />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.1em] text-brand-accent uppercase">
          Step 2 of 4
        </span>
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
          Create your organization
        </h1>
        <p className="text-sm leading-[1.6] text-muted-foreground">
          This is what your customers see on the portal and in every reply.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-name" className="font-semibold text-foreground">
          Organization name
        </Label>
        <Input
          id="signup-name"
          name="organization"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          className="h-11 rounded-sm text-sm md:h-10.5"
        />
        {errors.name ? (
          <p id="signup-name-error" className="text-sm text-destructive-strong">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-slug" className="font-semibold text-foreground">
          Portal address
        </Label>
        <Input
          id="signup-slug"
          name="slug"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          aria-invalid={Boolean(errors.slug)}
          aria-describedby={errors.slug ? "signup-slug-error" : "signup-slug-hint"}
          className="h-11 rounded-sm text-sm md:h-10.5"
        />
        {/* The design replaces the hint with the error rather than stacking them. The
            hint tracks the field live — it is the same `{slug}.servicedesk.pro` string. */}
        {errors.slug ? (
          <p id="signup-slug-error" className="text-sm text-destructive-strong">
            {errors.slug}
          </p>
        ) : (
          <p id="signup-slug-hint" className="text-sm text-muted-foreground">
            {slug.trim().toLowerCase() || "your-org"}.servicedesk.pro
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-timezone" className="font-semibold text-foreground">
          Time zone
        </Label>
        <Select value={timezone} onValueChange={setTimezone}>
          {/* `!` is load-bearing: SelectTrigger's own `data-[size=default]:h-8` is an
              attribute-qualified rule and outranks a plain height class, which silently
              rendered a 32px control against the design's 42px. */}
          <SelectTrigger
            id="signup-timezone"
            className="h-11! w-full rounded-sm text-sm md:h-10.5!"
          >
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
        {/* Bound to the selection, so it stays true as the zone changes. */}
        <p className="text-sm text-muted-foreground">{timezoneHint(timezone)}</p>
      </div>

      {/* 112×52, left-aligned — the capture's own geometry, not login's full-width CTA. */}
      <div className="flex gap-2.5">
        <Button
          type="submit"
          className="h-13 bg-brand-accent px-5 text-base font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          Continue
        </Button>
      </div>
    </AuthCard>
  );
}
