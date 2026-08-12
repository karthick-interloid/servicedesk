import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerSchema } from "@/features/auth/schemas/register";

/**
 * `registerAction` is the only server-side check on the whole four-step wizard: the payload
 * is assembled client-side out of `sessionStorage`, which the user can edit freely. These
 * cover the validation gate and the failure mapping; the service itself is mocked, since
 * exercising it for real would provision a tenant.
 */

const registerMock = vi.fn();

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
}));

vi.mock("@/features/auth/services/register.service", () => ({
  register: (...args: unknown[]) => registerMock(...args),
}));

const { registerAction } = await import("@/features/auth/actions");

const VALID = {
  fullName: "Ada Lovelace",
  email: "ada@acme.io",
  password: "correct-horse",
  organizationName: "Acme Support",
  portalSlug: "acme-support",
  timezoneId: "ist",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  dayStart: "09:00",
  dayEnd: "18:30",
  inviteUsers: [],
};

describe("registerSchema", () => {
  it("accepts the payload the wizard assembles", () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true);
  });

  it("allows a blank portal slug, which the service derives from the org name", () => {
    expect(registerSchema.safeParse({ ...VALID, portalSlug: "" }).success).toBe(true);
  });

  it("rejects a day that ends before it starts, on dayEnd", () => {
    const result = registerSchema.safeParse({ ...VALID, dayStart: "18:00", dayEnd: "09:00" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["dayEnd"]);
    expect(result.error?.issues[0]?.message).toBe("The day has to end after it starts");
  });

  it("rejects an empty working-day list", () => {
    expect(registerSchema.safeParse({ ...VALID, workingDays: [] }).success).toBe(false);
  });

  it("rejects an invite role outside membership_role", () => {
    const result = registerSchema.safeParse({
      ...VALID,
      inviteUsers: [{ email: "sam@acme.io", role: "owner" }],
    });

    // "owner" is the value the original controller used; it isn't in the enum.
    expect(result.success).toBe(false);
  });
});

describe("registerAction", () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  it("returns what the service provisioned", async () => {
    const provisioned = {
      user: { id: "u-1", email: VALID.email, fullName: VALID.fullName },
      tenant: { id: "t-1", name: "Acme Support", slug: "acme-support" },
      businessHoursId: "bh-1",
      plan: "Free",
      invitesSkipped: 0,
      // True against the linked project, which has "Confirm email" on — see the wizard's
      // confirmation panel.
      requiresEmailConfirmation: true,
    };
    registerMock.mockResolvedValue(provisioned);

    await expect(registerAction(VALID)).resolves.toEqual({ success: true, data: provisioned });
  });

  it("never reaches the service with an invalid payload", async () => {
    const result = await registerAction({ ...VALID, email: "nope" });

    expect(result).toMatchObject({ success: false, code: "validation" });
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("points at the steps rather than the fields, which may be off-screen", async () => {
    const result = await registerAction({ ...VALID, organizationName: "" });

    expect(result.success === false && result.message).toContain("check each step");
  });

  it("passes an AuthError's message through, so 'address taken' is actionable", async () => {
    registerMock.mockRejectedValue(
      new AuthError("That portal address is taken. Try acme-support-support."),
    );

    await expect(registerAction(VALID)).resolves.toMatchObject({
      success: false,
      code: "unknown",
      message: "That portal address is taken. Try acme-support-support.",
    });
  });

  it("hides an unexpected failure but logs it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    registerMock.mockRejectedValue(new Error("SUPABASE_SERVICE_ROLE_KEY is missing"));

    const result = await registerAction(VALID);

    expect(result).toEqual({
      success: false,
      code: "unknown",
      message: "We couldn't finish setting up your organization. Try again in a moment.",
    });
    expect(result.success === false && result.message).not.toContain("SERVICE_ROLE");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
