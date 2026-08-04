import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

const url = "http://localhost/api/health";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is open and returns 200 when no token is configured", async () => {
    const res = await GET(new Request(url));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  describe("when HEALTH_CHECK_TOKEN is set", () => {
    it("returns 200 for a correct Bearer token", async () => {
      vi.stubEnv("HEALTH_CHECK_TOKEN", "s3cret");
      const res = await GET(new Request(url, { headers: { authorization: "Bearer s3cret" } }));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ status: "ok" });
    });

    it("returns 404 when the token is missing", async () => {
      vi.stubEnv("HEALTH_CHECK_TOKEN", "s3cret");
      const res = await GET(new Request(url));
      expect(res.status).toBe(404);
    });

    it("returns 404 for a wrong token", async () => {
      vi.stubEnv("HEALTH_CHECK_TOKEN", "s3cret");
      const res = await GET(new Request(url, { headers: { authorization: "Bearer nope" } }));
      expect(res.status).toBe(404);
    });
  });
});
