import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `loginAction` is the trust boundary: it re-validates untrusted input and turns service
 * failures into copy the form can render. Both are worth pinning.
 *
 * The service is mocked wholesale rather than with `importActual` — the real module pulls in
 * `next/headers` and the Supabase client, neither of which has a request context here. That
 * means `AuthError` is re-declared below; it stays in step because the action only reads
 * `.code`/`.message` and `instanceof` resolves against this same class.
 */

const loginMock = vi.fn();

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
  login: (...args: unknown[]) => loginMock(...args),
}));

const { loginAction } = await import("@/features/auth/actions");

const VALID = { email: "sam@northwind.io", password: "hunter2hunter2", remember: false };

describe("loginAction", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("passes the signed-in user through on success", async () => {
    const user = { id: "u-1", email: VALID.email, tenantId: "t-1", role: "agent" };
    loginMock.mockResolvedValue(user);

    await expect(loginAction(VALID)).resolves.toEqual({ success: true, data: user });
    expect(loginMock).toHaveBeenCalledWith(VALID);
  });

  it("rejects a malformed payload before reaching the service", async () => {
    const result = await loginAction({ email: "not-an-email", password: "", remember: false });

    expect(result).toMatchObject({ success: false, code: "validation" });
    expect(result.success === false && result.fieldErrors).toMatchObject({
      email: ["Enter a valid email address"],
      password: ["Enter your password"],
    });
    // The whole point of re-validating: nothing hit Supabase.
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("rejects a payload that isn't an object at all", async () => {
    // A Server Action is a public POST endpoint, so this is reachable without the form.
    await expect(loginAction(null)).resolves.toMatchObject({ success: false, code: "validation" });
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("surfaces an AuthError's own code and message", async () => {
    loginMock.mockRejectedValue(
      new AuthError("Invalid login credentials", { status: 400, code: "invalid_credentials" }),
    );

    await expect(loginAction(VALID)).resolves.toEqual({
      success: false,
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
  });

  it("hides an unexpected failure behind generic copy", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    loginMock.mockRejectedValue(new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"));

    const result = await loginAction(VALID);

    expect(result).toEqual({
      success: false,
      code: "unknown",
      message: "We couldn't sign you in right now. Try again in a moment.",
    });
    // The detail must not reach the client, but it must reach the server log.
    expect(result.success === false && result.message).not.toContain("ANON_KEY");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
