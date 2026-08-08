import { describe, expect, it } from "vitest";

import { createOrgSchema } from "@/features/auth/schemas/create-org";
import { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password";
import { loginSchema } from "@/features/auth/schemas/login";
import { signupAccountSchema } from "@/features/auth/schemas/signup-account";

/**
 * The auth screens' validation moved out of hand-rolled `if` chains and into these
 * schemas, so the copy each rule produces is now testable without a browser. The
 * Playwright specs still own the behaviour around them (never navigating, the error
 * replacing the hint); these only pin the rules and their exact wording.
 */

/** The message the resolver would surface for `path` — first issue wins, as it does there. */
function messageFor(result: { success: boolean; error?: { issues: readonly unknown[] } }) {
  return (path: string) => {
    if (result.success) return undefined;
    const issues = (result.error?.issues ?? []) as { path: PropertyKey[]; message: string }[];
    return issues.find((issue) => issue.path.join(".") === path)?.message;
  };
}

describe("loginSchema", () => {
  it("reports the screen's own blank-email copy", () => {
    const message = messageFor(
      loginSchema.safeParse({ email: "  ", password: "x", remember: false }),
    );
    expect(message("email")).toBe("Enter your work email");
  });

  it("rejects an obvious non-address", () => {
    const message = messageFor(
      loginSchema.safeParse({ email: "not-an-email", password: "x", remember: false }),
    );
    expect(message("email")).toBe("Enter a valid email address");
  });

  it("requires a password but never judges its shape — there is no credential check", () => {
    const message = messageFor(
      loginSchema.safeParse({ email: "sam@northwind.io", password: "", remember: false }),
    );
    expect(message("password")).toBe("Enter your password");
    expect(
      loginSchema.safeParse({ email: "sam@northwind.io", password: "a", remember: false }).success,
    ).toBe(true);
  });

  it("trims the email it hands back", () => {
    const parsed = loginSchema.parse({
      email: "  sam@northwind.io  ",
      password: "x",
      remember: true,
    });
    expect(parsed.email).toBe("sam@northwind.io");
  });
});

describe("forgotPasswordSchema", () => {
  it("carries the same email rule as login", () => {
    const message = messageFor(forgotPasswordSchema.safeParse({ email: "" }));
    expect(message("email")).toBe("Enter your work email");
    expect(forgotPasswordSchema.safeParse({ email: "sam@northwind.io" }).success).toBe(true);
  });
});

describe("signupAccountSchema", () => {
  const valid = { email: "ada@acme.io", password: "correct-horse", confirm: "correct-horse" };

  it("accepts a well-formed account", () => {
    expect(signupAccountSchema.safeParse(valid).success).toBe(true);
  });

  it("separates the blank password from the too-short one", () => {
    expect(
      messageFor(signupAccountSchema.safeParse({ ...valid, password: "", confirm: "" }))(
        "password",
      ),
    ).toBe("Enter a password");
    expect(
      messageFor(signupAccountSchema.safeParse({ ...valid, password: "abc", confirm: "abc" }))(
        "password",
      ),
    ).toBe("Use at least 8 characters");
  });

  it("reports a mismatch on confirm, leaving password clean", () => {
    const message = messageFor(
      signupAccountSchema.safeParse({ ...valid, confirm: "correcthorse" }),
    );
    expect(message("confirm")).toBe("Passwords don't match");
    expect(message("password")).toBeUndefined();
  });

  it("does not call two blank fields a mismatch", () => {
    const message = messageFor(
      signupAccountSchema.safeParse({ ...valid, password: "", confirm: "" }),
    );
    expect(message("confirm")).toBe("Re-enter your password");
  });
});

describe("createOrgSchema", () => {
  const valid = { name: "Northwind Support", slug: "northwind-support", timezone: "UTC" };

  it("accepts a free portal address", () => {
    expect(createOrgSchema.safeParse(valid).success).toBe(true);
  });

  it("normalises the slug before checking its shape", () => {
    expect(createOrgSchema.parse({ ...valid, slug: "  ACME-EU  " }).slug).toBe("acme-eu");
    // A space fails on the pattern, not on the capitals.
    expect(messageFor(createOrgSchema.safeParse({ ...valid, slug: "Acme EU!" }))("slug")).toBe(
      "Use lowercase letters, numbers and hyphens only",
    );
  });

  it("treats the design's seeded address as taken", () => {
    expect(messageFor(createOrgSchema.safeParse({ ...valid, slug: "northwind" }))("slug")).toBe(
      "That address is taken. Try northwind-support.",
    );
  });

  it("requires an organization name", () => {
    expect(messageFor(createOrgSchema.safeParse({ ...valid, name: "   " }))("name")).toBe(
      "Enter an organization name",
    );
  });
});
