"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyTheme,
  getSystemTheme,
  isTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  /** The user's preference: "light" | "dark" | "system". */
  theme: Theme;
  /** What's actually applied to the DOM after resolving "system": "light" | "dark". */
  resolvedTheme: ResolvedTheme;
  /** The OS's current preference, tracked live. */
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

// The `storage` event only fires in *other* tabs, so setTheme also emits this
// custom event to notify subscribers within the same tab.
const THEME_CHANGE_EVENT = "themechange";

// --- External store: the persisted preference --------------------------------
// Both preference and OS setting are read via useSyncExternalStore rather than
// useState + an effect. It's React's blessed way to read browser-only sources
// during hydration: it renders the server snapshot first, then swaps in the real
// client value before paint — no hydration mismatch, and no setState-in-effect.
function subscribeStoredTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

// --- External store: the OS preference ---------------------------------------
function subscribeSystemTheme(onStoreChange: () => void) {
  const mql = window.matchMedia(SYSTEM_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const theme = useSyncExternalStore(
    subscribeStoredTheme,
    () => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return isTheme(stored) ? stored : defaultTheme;
    },
    () => defaultTheme,
  );

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    (): ResolvedTheme => "light",
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Keep the DOM in sync with the resolved theme. On first client render this
  // matches what the pre-hydration inline script already applied, so it's a no-op;
  // on later changes (user, OS, or another tab) it applies with transitions
  // suppressed so colors snap instead of animating.
  useEffect(() => {
    applyTheme(resolvedTheme, true);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, quota): the choice still applies
      // for this session via the dispatched event, it just won't persist.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [theme, resolvedTheme, systemTheme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a <ThemeProvider>.");
  }
  return context;
}
