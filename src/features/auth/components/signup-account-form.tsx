"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm, type ControllerRenderProps } from "react-hook-form";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignupStepper } from "@/features/auth/components/signup-stepper";
import {
  MIN_PASSWORD_LENGTH,
  signupAccountSchema,
  type SignupAccountValues,
} from "@/features/auth/schemas/signup-account";

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

/** Matches the field metrics measured on login and create-org: 42px, 6px radius. */
const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";

export function SignupAccountForm() {
  const router = useRouter();
  const form = useForm<SignupAccountValues>({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  function onSubmit() {
    // Nothing is created — this only advances the flow to the next route.
    router.push("/create-org");
  }

  return (
    <Form {...form}>
      {/* Inherited verbatim from create-org / login: 440px cap, 16px radius, 32px padding
          (24/20 below md), 18px block gap. */}
      <AuthCard onSubmit={form.handleSubmit(onSubmit)}>
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem id="account-email" className="flex flex-col gap-1.5">
              <FormLabel className="font-semibold text-foreground">Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={FIELD_CLASS}
                  {...field}
                />
              </FormControl>
              {/* Error replaces the hint rather than stacking with it — that rule lives in
                  `FormDescription`. See components/ui/form.tsx. */}
              <FormDescription>Use your work address — invites and alerts go here.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <PasswordField
              id="account-password"
              label="Password"
              autoComplete="new-password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              field={field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <PasswordField
              id="account-confirm"
              label="Confirm password"
              autoComplete="new-password"
              hint="Type it once more so we know it&rsquo;s right."
              field={field}
            />
          )}
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
    </Form>
  );
}

/**
 * Password input with a reveal toggle on the trailing edge. `InputGroup` supplies the
 * bordered wrapper and a transparent control, so the field keeps the same 42px height,
 * 6px radius and `--input` border as the plain inputs beside it — the toggle sits inside
 * the field rather than beside it.
 *
 * The reveal is local UI state, not form state: it never leaves this component and the
 * schema has no opinion about it.
 */
function PasswordField({
  id,
  label,
  autoComplete,
  hint,
  field,
}: {
  id: string;
  label: string;
  autoComplete: string;
  hint: string;
  field: ControllerRenderProps<SignupAccountValues, "password" | "confirm">;
}) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <FormItem id={id} className="flex flex-col gap-1.5">
      <FormLabel className="font-semibold text-foreground">{label}</FormLabel>
      {/* InputGroup's own `h-8` and `rounded-lg` are plain classes, so these merge over
          them without needing an important modifier. */}
      <InputGroup className={FIELD_CLASS}>
        <FormControl>
          <InputGroupInput
            type={revealed ? "text" : "password"}
            autoComplete={autoComplete}
            className="text-sm"
            {...field}
          />
        </FormControl>
        <InputGroupAddon align="inline-end" className="pr-2">
          <InputGroupButton
            size="icon-xs"
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FormDescription>{hint}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}
