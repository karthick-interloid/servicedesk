"use server";

import { loginSchema } from "@/features/auth/schemas/login";
import { registerSchema } from "@/features/auth/schemas/register";
import {
  AuthError,
  googleLogin,
  login,
  logout,
  safeNext,
} from "@/features/auth/services/auth.service";
import { register } from "@/features/auth/services/register.service";
import type { ActionResult, RegisteredOrg, SessionUser } from "@/features/auth/types";

/**
 * Server Actions for the auth feature. This is the boundary the client is allowed to call;
 * `./services/auth.service` stays server-only behind it.
 */

/**
 * Sign in.
 *
 * Re-validates with `loginSchema` even though `login-form.tsx` already resolves against it.
 * That isn't belt-and-braces: a Server Action is a public POST endpoint reachable without
 * the UI (see node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md),
 * so client-side validation is a convenience and this is the real check.
 *
 * Takes `unknown` for the same reason — the argument is untrusted input off the wire, and
 * typing it `LoginValues` would be a claim about the caller we can't enforce.
 */
export async function loginAction(values: unknown): Promise<ActionResult<SessionUser>> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "validation",
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // `remember` is validated but not consumed: session lifetime is set by Supabase's
    // `jwt_expiry` and refresh-token rotation (supabase/config.toml), not per request, so
    // honouring the checkbox needs a cookie-maxAge decision that doesn't exist yet.
    return { success: true, data: await login(parsed.data) };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, code: error.code, message: error.message };
    }

    // Anything else is ours, not the user's — a missing key, an unreachable project. Keep
    // the detail server-side and hand back copy that doesn't leak configuration.
    console.error("[auth] loginAction failed", error);

    return {
      success: false,
      code: "unknown",
      message: "We couldn't sign you in right now. Try again in a moment.",
    };
  }
}

/**
 * Start Google sign-in and hand back the URL to send the browser to.
 *
 * It returns a URL instead of calling `redirect()` because the destination is a third-party
 * origin: a Server Action's `redirect` is resolved by the client router, and pointing that
 * at accounts.google.com is not a navigation it can make. The caller does
 * `window.location.assign(url)` — see `useGoogleLogin`.
 *
 * Nothing is signed in at this point. The session is created on the way back, in
 * `src/app/auth/callback/route.ts`.
 *
 * `next` is untrusted (it comes off the query string) and is reduced to a same-origin path
 * by `safeNext` before it is ever put on a redirect URL.
 */
export async function googleLoginAction(next?: unknown): Promise<ActionResult<{ url: string }>> {
  try {
    const url = await googleLogin({
      next: safeNext(typeof next === "string" ? next : null),
    });

    return { success: true, data: url };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, code: error.code, message: error.message };
    }

    console.error("[auth] googleLoginAction failed", error);

    return {
      success: false,
      code: "unknown",
      message: "We couldn't start Google sign-in. Try again in a moment.",
    };
  }
}

/**
 * Sign out.
 *
 * No argument and so no schema: the only input is the session cookie the browser already
 * sends, and the identity comes from the token, never from the caller. That also makes the
 * action safe as a public POST — the worst an unauthenticated hit can do is clear cookies
 * that carry no session.
 *
 * Deliberately does NOT call `redirect()`. The design's Sign out sits in a dropdown that has
 * to survive a failed attempt and show why (see `profile-menu.tsx`); a redirect throws past
 * the caller and would leave a user with a live session looking at the login screen.
 */
export async function logoutAction(): Promise<ActionResult<null>> {
  try {
    await logout();

    return { success: true, data: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, code: error.code, message: error.message };
    }

    console.error("[auth] logoutAction failed", error);

    return {
      success: false,
      code: "unknown",
      message: "We couldn't sign you out right now. Try again in a moment.",
    };
  }
}

/**
 * Register: create the account and provision its organization, in one call.
 *
 * The wizard collects across three routes and submits here on "Finish setup", so this is the
 * first and only server-side check on any of it. The client assembled the payload out of
 * `sessionStorage`, which the user can edit — `registerSchema` is what makes it trustworthy.
 */
export async function registerAction(values: unknown): Promise<ActionResult<RegisteredOrg>> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      code: "validation",
      // The failing field may well belong to an earlier step the user can no longer see, so
      // the message has to stand on its own rather than say "check the fields above".
      message: "Some of your details are missing or invalid. Go back and check each step.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    return { success: true, data: await register(parsed.data) };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, code: error.code, message: error.message };
    }

    console.error("[auth] registerAction failed", error);

    return {
      success: false,
      code: "unknown",
      message: "We couldn't finish setting up your organization. Try again in a moment.",
    };
  }
}
