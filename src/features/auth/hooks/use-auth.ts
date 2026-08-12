"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { googleLoginAction, loginAction, logoutAction } from "@/features/auth/actions";
import type { LoginValues } from "@/features/auth/schemas/login";
import type { ActionResult, SessionUser } from "@/features/auth/types";

/**
 * Client-side entry point for the auth actions.
 *
 * Each hook wraps one Server Action with the two things a component would otherwise repeat:
 * a pending flag for the control that triggered it, and the post-success navigation. Both
 * hooks return the `ActionResult` unchanged so the caller decides how a failure is shown —
 * `login-form.tsx` puts it in the form's root error, `profile-menu.tsx` in a toast.
 *
 * `useLogin` is rendered by `login-form.tsx`; `useLogout` by `profile-menu.tsx`.
 */

type UseLoginOptions = {
  /** Where to land on success. Pass `null` to stay put and handle navigation yourself. */
  redirectTo?: string | null;
};

export function useLogin({ redirectTo = "/tickets" }: UseLoginOptions = {}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(
    async (values: LoginValues): Promise<ActionResult<SessionUser>> => {
      setIsPending(true);

      let result: ActionResult<SessionUser>;

      try {
        result = await loginAction(values);
      } catch (error) {
        // The action catches its own failures, so reaching here means the request itself
        // died — offline, or a deploy swapped the action id mid-session.
        setIsPending(false);
        console.error("[auth] login request failed", error);

        return {
          success: false,
          code: "unknown",
          message: "Network error. Check your connection and retry.",
        };
      }

      if (result.success && redirectTo) {
        // `refresh()` before navigating: the session cookies were set during the action, so
        // without it the destination's Server Components come from the client router cache
        // as their signed-out versions.
        router.refresh();
        router.replace(redirectTo);

        // Stay pending on purpose. Navigation is async and this component is still mounted
        // until it commits; clearing the flag here would re-enable the submit button and let
        // a second sign-in fire into the redirect.
        return result;
      }

      setIsPending(false);

      return result;
    },
    [redirectTo, router],
  );

  return { login, isPending };
}

/**
 * Google sign-in.
 *
 * Unlike `useLogin` there is no router navigation here: the action returns a URL on
 * accounts.google.com, and leaving this origin is a full document load, not a client-side
 * route change. `window.location.assign` rather than `replace` so the browser Back button
 * still returns the user to the login form if they abandon the consent screen.
 *
 * `redirectTo` is where they land *after* the callback has traded the code for a session —
 * it rides along on the callback URL, since the trip through Google is stateless from here.
 *
 * Stays pending on success for the same reason `useLogin` does: the navigation is already
 * committed and re-enabling the button would let a second consent flow start on top of it.
 */
export function useGoogleLogin({ redirectTo = "/tickets" }: UseLoginOptions = {}) {
  const [isPending, setIsPending] = useState(false);

  const signInWithGoogle = useCallback(async (): Promise<ActionResult<{ url: string }>> => {
    setIsPending(true);

    let result: ActionResult<{ url: string }>;

    try {
      result = await googleLoginAction(redirectTo);
    } catch (error) {
      setIsPending(false);
      console.error("[auth] google login request failed", error);

      return {
        success: false,
        code: "unknown",
        message: "Network error. Check your connection and retry.",
      };
    }

    if (result.success) {
      window.location.assign(result.data.url);

      return result;
    }

    setIsPending(false);

    return result;
  }, [redirectTo]);

  return { signInWithGoogle, isPending };
}

type UseLogoutOptions = {
  /** Where to land once the session is gone. Pass `null` to handle navigation yourself. */
  redirectTo?: string | null;
};

export function useLogout({ redirectTo = "/login" }: UseLogoutOptions = {}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const logout = useCallback(async (): Promise<ActionResult<null>> => {
    setIsPending(true);

    let result: ActionResult<null>;

    try {
      result = await logoutAction();
    } catch (error) {
      setIsPending(false);
      console.error("[auth] logout request failed", error);

      return {
        success: false,
        code: "unknown",
        message: "Network error. Check your connection and retry.",
      };
    }

    if (result.success && redirectTo) {
      // `refresh()` first, and it matters more here than on the way in: without it the
      // signed-in Server Component output for every visited route stays in the client router
      // cache, and a Back press after signing out would re-render it from there.
      router.refresh();
      router.replace(redirectTo);

      // Left pending on purpose — same reasoning as `useLogin`: the trigger stays mounted
      // until the navigation commits, and re-enabling it would allow a second call.
      return result;
    }

    setIsPending(false);

    return result;
  }, [redirectTo, router]);

  return { logout, isPending };
}
