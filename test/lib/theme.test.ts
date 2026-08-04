import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  getSystemTheme,
  isTheme,
  resolveTheme,
  themeInitScript,
  THEMES,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

// Point matchMedia at a fixed system preference for a single test.
function setSystemDark(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.restoreAllMocks();
});

describe("isTheme", () => {
  it("accepts the three known themes and rejects anything else", () => {
    for (const theme of THEMES) expect(isTheme(theme)).toBe(true);
    expect(isTheme("blue")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(1)).toBe(false);
  });
});

describe("getSystemTheme / resolveTheme", () => {
  it("reads the OS preference", () => {
    setSystemDark(true);
    expect(getSystemTheme()).toBe("dark");
    setSystemDark(false);
    expect(getSystemTheme()).toBe("light");
  });

  it("pins explicit themes and defers 'system' to the OS", () => {
    setSystemDark(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("system")).toBe("dark");
    setSystemDark(false);
    expect(resolveTheme("system")).toBe("light");
  });
});

describe("applyTheme", () => {
  it("toggles the dark class and sets color-scheme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("cleans up the transition-disabling style element when asked to", () => {
    const before = document.head.querySelectorAll("style").length;
    applyTheme("dark", true);
    // The temporary <style> is added and removed synchronously within the call.
    expect(document.head.querySelectorAll("style").length).toBe(before);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("themeInitScript", () => {
  it("references the shared storage key and is self-contained (IIFE, error-guarded)", () => {
    expect(themeInitScript).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(themeInitScript).toContain("prefers-color-scheme");
    expect(themeInitScript.startsWith("(function()")).toBe(true);
    expect(themeInitScript).toContain("catch");
  });
});
