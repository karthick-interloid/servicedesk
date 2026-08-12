import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `logoutAction` takes no input, so there is no validation to pin — what matters is the
 * other half of the boundary: a failed sign-out must not report success, because the caller
 * turns success into a redirect to /login and a user whose session is still live would be
 * shown an ending that didn't happen.
 *
 * The service is mocked wholesale for the same reason as the login test — the real module
 * pulls in `next/headers` and the Supabase client, neither of which has a request context
 * here — so `AuthError` is re-declared and `instanceof` resolves against this same class.
 */

const logoutMock = vi.fn();

class AuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, { status = 400, code = "unknown" } = {}) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

vi.mock("@/features/auth/services/auth.service", () => ({
  AuthError,
  login: vi.fn(),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

const { logoutAction } = await import("@/features/auth/actions");

describe("logoutAction", () => {
  beforeEach(() => {
    logoutMock.mockReset();
  });

  it("reports success once the session is revoked", async () => {
    logoutMock.mockResolvedValue(undefined);

    await expect(logoutAction()).resolves.toEqual({ success: true, data: null });
    // No argument: the identity comes from the session cookie, never from the caller.
    expect(logoutMock).toHaveBeenCalledWith();
  });

  it("surfaces an AuthError's own code and message", async () => {
    logoutMock.mockRejectedValue(
      new AuthError("We couldn't sign you out. Try again in a moment.", {
        status: 500,
        code: "unknown",
      }),
    );

    await expect(logoutAction()).resolves.toEqual({
      success: false,
      code: "unknown",
      message: "We couldn't sign you out. Try again in a moment.",
    });
  });

  it("hides an unexpected failure behind generic copy", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    logoutMock.mockRejectedValue(new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"));

    const result = await logoutAction();

    expect(result).toEqual({
      success: false,
      code: "unknown",
      message: "We couldn't sign you out right now. Try again in a moment.",
    });
    // The detail must not reach the client, but it must reach the server log.
    expect(result.success === false && result.message).not.toContain("ANON_KEY");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("never reports success when the revoke failed", async () => {
    // The one outcome that would be actively harmful: `useLogout` redirects to /login on
    // success, so a false positive leaves a live session looking signed out.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    for (const failure of [new AuthError("nope"), new Error("boom")]) {
      logoutMock.mockRejectedValueOnce(failure);
      await expect(logoutAction()).resolves.toMatchObject({ success: false });
    }

    consoleError.mockRestore();
  });
});
