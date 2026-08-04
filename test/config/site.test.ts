import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";

// Values here come from the `test.env` block in vitest.config.mts.
describe("siteConfig", () => {
  it("maps the public site env vars", () => {
    expect(siteConfig).toEqual({
      url: "https://test.local",
      name: "Test Starter",
      description: "A starter template used in tests.",
      twitterHandle: "@teststarter",
    });
  });
});
