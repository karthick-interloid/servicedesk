"use client";

import { useEffect, useState, type RefObject } from "react";
import { useTheme } from "@/context/theme-provider";

/**
 * Resolved values keyed by probe id. Colour probes also publish `<id>.raw`
 * (the custom property's own computed token stream) so the board can show both
 * what the variable says and what the browser actually paints.
 */
export type Measured = Record<string, string>;

/**
 * Reads what the browser computes for every `[data-probe]` element inside `scope`.
 * Re-runs whenever the resolved theme flips, so the same board reports both themes.
 *
 * Nothing here styles anything — it only observes, so the board can never mask a
 * token defect by accidentally restating it.
 */
export function useMeasured(scope: RefObject<HTMLElement | null>): Measured {
  const { resolvedTheme } = useTheme();
  const [measured, setMeasured] = useState<Measured>({});

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    // Measure after the browser has settled the theme class and any webfont swap.
    const frame = requestAnimationFrame(() => {
      const next: Measured = {};
      const rootStyle = getComputedStyle(document.documentElement);

      for (const el of root.querySelectorAll<HTMLElement>("[data-probe]")) {
        const key = el.dataset["probe"];
        if (!key) continue;
        const cs = getComputedStyle(el);

        switch (el.dataset["probeKind"]) {
          case "color":
            next[key] = cs.backgroundColor;
            break;
          case "radius":
            next[key] = cs.borderTopLeftRadius;
            break;
          case "shadow":
            next[key] = cs.boxShadow;
            break;
          case "size":
            next[key] = cs.width;
            break;
          case "type":
            next[`${key}.size`] = cs.fontSize;
            next[`${key}.weight`] = cs.fontWeight;
            next[`${key}.leading`] = cs.lineHeight;
            next[`${key}.tracking`] = cs.letterSpacing;
            next[`${key}.family`] = cs.fontFamily;
            break;
          default:
            break;
        }

        const varName = el.dataset["probeVar"];
        if (varName) next[`${key}.raw`] = rootStyle.getPropertyValue(varName).trim();
      }

      setMeasured(next);
    });

    return () => cancelAnimationFrame(frame);
  }, [scope, resolvedTheme]);

  return measured;
}
