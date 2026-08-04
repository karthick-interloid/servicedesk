import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/context/theme-provider";

// A controllable matchMedia whose registered "change" listener can be fired to
// simulate the OS flipping its color scheme.
type Listener = (event: MediaQueryListEvent) => void;
let systemListeners: Listener[] = [];
let systemMatches = false;

function installMatchMedia() {
  systemListeners = [];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return systemMatches;
    },
    media: query,
    onchange: null,
    addEventListener: (_: "change", cb: Listener) => systemListeners.push(cb),
    removeEventListener: (_: "change", cb: Listener) => {
      systemListeners = systemListeners.filter((l) => l !== cb);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function emitSystemChange(matches: boolean) {
  systemMatches = matches;
  act(() => {
    for (const cb of systemListeners) cb({ matches } as MediaQueryListEvent);
  });
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => {
  systemMatches = false;
  installMatchMedia();
  localStorage.clear();
});

afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.restoreAllMocks();
});

describe("useTheme", () => {
  it("throws a clear error when used outside a provider", () => {
    // Silence the expected React error log for the throwing render.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(/within a <ThemeProvider>/);
    spy.mockRestore();
  });
});

describe("ThemeProvider", () => {
  it("defaults to 'system' and resolves it from the OS preference", () => {
    systemMatches = true; // OS is dark
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("hydrates the stored preference on mount", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme updates state, the DOM, and localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolvedTheme).toBe("light");

    act(() => result.current.setTheme("dark"));

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("follows live OS changes while in 'system' mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.resolvedTheme).toBe("light");

    emitSystemChange(true);
    expect(result.current.systemTheme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ignores OS changes once an explicit theme is pinned", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("light"));

    emitSystemChange(true); // OS goes dark, but we're pinned to light
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("passes children through", () => {
    render(
      <ThemeProvider>
        <p>hello theme</p>
      </ThemeProvider>,
    );
    expect(screen.getByText("hello theme")).toBeInTheDocument();
  });
});
