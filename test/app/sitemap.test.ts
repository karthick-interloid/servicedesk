import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("lists the home and about routes with priorities", () => {
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual(["https://test.local", "https://test.local/about"]);
    expect(entries[0]?.priority).toBe(1);
    expect(entries[1]?.priority).toBe(0.8);
    for (const entry of entries) {
      expect(entry.changeFrequency).toBe("monthly");
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
