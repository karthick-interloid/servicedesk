"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { createOrgSchema, type CreateOrgValues } from "@/features/auth/schemas/create-org";
import { patchSignupDraft, readSignupDraft } from "@/features/auth/store/signup-draft";

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

/** Matches the field metrics measured on login: 42px, 6px radius. */
const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";

export function CreateOrgForm() {
  const router = useRouter();

  // Read once, on mount. The draft is the source of truth across the three routes, so
  // arriving here via Back from /onboarding restores what was typed rather than resetting it.
  const [draft] = React.useState(readSignupDraft);

  const form = useForm<CreateOrgValues>({
    // Empty, not the design's seeded "Northwind Support" / "northwind". Those made the
    // capture render as drawn, but this screen now provisions a real organization — a user
    // who clicks straight through would create one called Northwind on someone else's
    // portal address. Restore them in `defaultValues` for a capture-identical screenshot.
    defaultValues: {
      name: draft.organizationName,
      slug: draft.portalSlug,
      timezone: draft.timezoneId || DEFAULT_TIMEZONE_ID,
    },
    resolver: zodResolver(createOrgSchema),
  });

  // The portal-address hint tracks the field live, so it stays the same string the
  // schema will normalise on submit. `useWatch` rather than `form.watch()`: the latter
  // returns an unmemoizable function and makes React Compiler skip the whole component.
  const slug = useWatch({ control: form.control, name: "slug" });

  function onSubmit(values: CreateOrgValues) {
    // Still nothing created; the organization is provisioned by "Finish setup" on
    // /onboarding. `timezoneId` is written here and then offered again on onboarding step 1,
    // because the design asks for it on both screens — the later answer wins.
    patchSignupDraft({
      organizationName: values.name,
      portalSlug: values.slug,
      timezoneId: values.timezone,
    });

    router.push("/onboarding");
  }

  return (
    <Form {...form}>
      {/* 440px cap, 16px radius, 32px padding (24/20 below md), 18px block gap — `authCard`. */}
      <AuthCard onSubmit={form.handleSubmit(onSubmit)}>
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem id="signup-name" className="flex flex-col gap-1.5">
              <FormLabel className="font-semibold text-foreground">Organization name</FormLabel>
              <FormControl>
                <Input className={FIELD_CLASS} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem id="signup-slug" className="flex flex-col gap-1.5">
              <FormLabel className="font-semibold text-foreground">Portal address</FormLabel>
              <FormControl>
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={FIELD_CLASS}
                  {...field}
                />
              </FormControl>
              {/* `FormDescription` yields to the error rather than stacking under it —
                  the design replaces the hint. See components/ui/form.tsx. */}
              <FormDescription>
                {slug.trim().toLowerCase() || "your-org"}.servicedesk.pro
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem id="signup-timezone" className="flex flex-col gap-1.5">
              <FormLabel className="font-semibold text-foreground">Time zone</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  {/* `!` is load-bearing: SelectTrigger's own `data-[size=default]:h-8` is
                      an attribute-qualified rule and outranks a plain height class, which
                      silently rendered a 32px control against the design's 42px. */}
                  <SelectTrigger className="h-11! w-full rounded-sm text-sm md:h-10.5!">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Bound to the selection, so it stays true as the zone changes. */}
              <FormDescription>{timezoneHint(field.value)}</FormDescription>
            </FormItem>
          )}
        />

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
    </Form>
  );
}
