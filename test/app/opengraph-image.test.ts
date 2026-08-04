import { describe, expect, it } from "vitest";
import * as og from "@/app/opengraph-image";
import * as twitter from "@/app/twitter-image";

// The ImageResponse render (default export) is a next/og runtime concern left
// to the build/E2E; here we assert the metadata exports both routes share.
describe("opengraph-image metadata", () => {
  it("exposes the expected size and content type", () => {
    expect(og.size).toEqual({ width: 1200, height: 630 });
    expect(og.contentType).toBe("image/png");
    expect(og.alt).toBe("Test Starter");
  });

  it("twitter-image re-exports the same metadata", () => {
    expect(twitter.size).toEqual(og.size);
    expect(twitter.contentType).toBe(og.contentType);
    expect(twitter.alt).toBe(og.alt);
  });
});
