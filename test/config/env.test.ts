import { afterEach, describe, expect, it, vi } from "vitest";

// env.ts validates process.env at import time, so each case re-imports the
// module with a fresh module registry after stubbing the environment.
describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("parses a valid environment", async () => {
    vi.resetModules();
    const { env } = await import("@/config/env");
    expect(env.NEXT_PUBLIC_SITE_NAME).toBe("Test Starter");
    expect(env.NODE_ENV).toBe("test");
  });

  it("coerces empty optional strings to undefined", async () => {
    vi.stubEnv("NEXT_PUBLIC_TWITTER_HANDLE", "");
    vi.resetModules();
    const { env } = await import("@/config/env");
    expect(env.NEXT_PUBLIC_TWITTER_HANDLE).toBeUndefined();
  });

  it("throws when a required variable is missing", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.resetModules();
    await expect(import("@/config/env")).rejects.toThrow(/Invalid environment variables/);
  });

  it("throws when a public URL is malformed", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");
    vi.resetModules();
    await expect(import("@/config/env")).rejects.toThrow(/Invalid environment variables/);
  });
});
