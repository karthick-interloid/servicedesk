"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/features/auth/components/auth-card";
import { loginSchema, type LoginValues } from "@/features/auth/schemas/login";
import { ORG } from "@/features/shell/lib/identity";

/**
 * Login card, transcribed from `Update design.dc.html` → `authCard` and the `scrLogin`
 * block, and measured against design-reference/log-in--light.png (1:1 at 1440).
 *
 * Measured: card 440px wide, 16px radius, 32px padding, 18px gap between blocks; fields
 * 42px tall with a 6px radius; both buttons 52px. Field metrics override the design
 * system's documented 40px — this screen renders 42px and the screen wins.
 *
 * VISUAL + CLIENT VALIDATION ONLY. There is no auth, no session, no server action. Submit
 * is intercepted, validated by `loginSchema`, and then reports the design's own failure
 * copy so the error state is reachable; nothing is sent anywhere.
 */

/** The design's seeded values, so the screen renders as the capture does. */
const SEED_EMAIL = "sam@northwind.io";

/** 42px measured on this screen, 44px touch floor below md; 6px radius. */
const FIELD_CLASS = "h-11 rounded-sm text-sm md:h-10.5";

export function LoginForm() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: SEED_EMAIL, password: "", remember: false },
  });

  function onSubmit() {
    // No credential check exists, so a well-formed submission lands on the design's own
    // failure copy. This is what makes the error state demonstrable — and it is set by
    // hand precisely because it is NOT a shape error the schema could have caught.
    form.setError("root", {
      message: "Check your password, or reset it. Two attempts left before a 15-minute lock.",
    });
    form.setError("password", { message: "Incorrect password" });
  }

  const formError = form.formState.errors.root?.message;

  return (
    <Form {...form}>
      {/* 440px cap, 16px radius, 32px padding (24/20 below md), 18px block gap. */}
      <AuthCard onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-balance text-foreground">
            Sign in to {ORG.name}
          </h1>
          <p className="text-sm leading-[1.6] text-muted-foreground">
            Work your queue against live SLA targets.
          </p>
        </div>

        {/* 10px radius and 12/14px padding are this screen's own; the tone comes from the
            primitive. Only the radius/padding differ from the Alert default. */}
        {formError ? (
          <Alert tone="error" className="rounded-[10px] px-3.5 py-3">
            <CircleAlert className="size-[18px]" aria-hidden />
            <AlertDescription className="text-sm leading-[1.55]">
              <span className="font-bold">That email and password don&apos;t match.</span>{" "}
              {formError}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3.5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem id="login-email" className="flex flex-col gap-1.5">
                <FormLabel className="font-semibold text-foreground">Work email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@northwind.io"
                    className={FIELD_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem id="login-password" className="flex flex-col gap-1.5">
                <FormLabel className="font-semibold text-foreground">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={FIELD_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem id="login-remember" className="flex flex-row items-center gap-2.5">
                  <FormControl>
                    <Checkbox
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      className="size-[18px] rounded-[5px]"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-foreground">
                    Keep me signed in
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* 52px measured; the design's `lg` button with a full-width `fullBtn` override. */}
          <Button
            type="submit"
            className="h-13 w-full bg-brand-accent text-base font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Sign in
          </Button>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Social login, inert: no provider, no OAuth, no handler in this pass. */}
          <Button
            type="button"
            variant="neutral"
            className="h-13 w-full border-input text-base text-brand-accent"
          >
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand-accent hover:underline">
            Create an organization
          </Link>
        </p>
      </AuthCard>
    </Form>
  );
}
