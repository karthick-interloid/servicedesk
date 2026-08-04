// Framework-agnostic theme primitives shared by two places that must never
// disagree about what "dark" means: the pre-hydration inline script injected in
// src/app/layout.tsx, and the client-side ThemeProvider in src/context/theme-provider.tsx.
// Centralizing the storage key, class name, and resolution rules here keeps the
// blocking script and the React runtime in lockstep.

export const THEME_STORAGE_KEY = "theme";

// User-selectable preferences. "system" (a.k.a. "auto") follows the OS setting via
// prefers-color-scheme; "light"/"dark" pin the theme regardless of the OS.
export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

// The concrete theme actually applied to the DOM — resolving "system" to one of these.
export type ResolvedTheme = "light" | "dark";

// The class Tailwind's dark variant keys off (see globals.css: `@custom-variant dark`).
export const DARK_CLASS = "dark";

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** The OS's current color-scheme preference. Browser-only (reads matchMedia). */
export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

/** Resolve a user preference to the concrete theme to apply. Browser-only. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

/**
 * Apply a resolved theme to the document: toggle the dark class and set the
 * native `color-scheme` (so form controls, scrollbars, and the like match).
 *
 * When `disableTransitions` is set, CSS transitions are suppressed for the single
 * frame of the switch so colors snap instead of animating — the standard trick to
 * avoid a visible cross-fade when the user flips themes.
 */
export function applyTheme(resolved: ResolvedTheme, disableTransitions = false): void {
  const root = document.documentElement;

  let restore: (() => void) | undefined;
  if (disableTransitions) {
    const style = document.createElement("style");
    style.appendChild(document.createTextNode("*,*::before,*::after{transition:none !important}"));
    document.head.appendChild(style);
    restore = () => {
      // Force a reflow so the "no transitions" style is flushed before we remove it.
      document.body.getBoundingClientRect();
      document.head.removeChild(style);
    };
  }

  root.classList.toggle(DARK_CLASS, resolved === "dark");
  root.style.colorScheme = resolved;

  restore?.();
}

// The blocking <script> injected at the very top of <body>. It runs synchronously
// before first paint, so the correct theme class is on <html> before anything is
// rendered — no flash of the wrong theme (FOUC). It intentionally duplicates the
// resolution logic above as a self-contained string (it can't import at that point)
// and swallows errors: a blocked/broken localStorage must never take the page down.
export const themeInitScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var m=window.matchMedia(${JSON.stringify(
  SYSTEM_QUERY,
)}).matches;var dark=t==="dark"||((t===null||t==="system")&&m);d.classList.toggle(${JSON.stringify(
  DARK_CLASS,
)},dark);d.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
