import { describe, expect, it } from "vitest";
import {
  compare,
  formatScore,
  hexToRgb,
  liveCheckIds,
  runChecks,
  verdictFor,
} from "@/features/token-audit/tokens";
import {
  EXCEPTIONS,
  exceptionFor,
  staleExceptions,
  unsignedExceptions,
} from "@/features/token-audit/exceptions";

/**
 * These tests exist because the comparator lied once.
 *
 * The first token-audit run reported all four shadow roles and the overlay scrim as
 * FAILING. Every one was a false negative: Tailwind v4 composes `box-shadow` from five
 * `--tw-*` slots (so the computed value carries four transparent placeholders), the
 * browser serialises the shadow colour FIRST while CSS authors write it LAST, and it
 * normalises `.45` to `0.45`. None of that is a value difference.
 *
 * A report built on that pass would have claimed a 0% shadow category. The cases below
 * pin the normalisation so it cannot regress — and, just as importantly, pin that
 * genuine differences still fail.
 */

describe("hexToRgb", () => {
  it("converts a 6-digit hex to the browser's rgb() serialisation", () => {
    expect(hexToRgb("#166534")).toBe("rgb(22, 101, 52)");
  });

  it("is case-insensitive and tolerates surrounding whitespace", () => {
    expect(hexToRgb("  #DCFCE7 ")).toBe("rgb(220, 252, 231)");
  });

  it("returns null for anything that is not a 6-digit hex", () => {
    expect(hexToRgb("#fff")).toBeNull();
    expect(hexToRgb("rgb(1, 2, 3)")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });
});

describe("compare — unscored", () => {
  it("is unscored when the design declares nothing", () => {
    expect(compare(null, "rgb(15, 23, 42)")).toBe("unscored");
  });

  it("is unscored before the probe has reported", () => {
    expect(compare("#166534", undefined)).toBe("unscored");
    expect(compare("#166534", "")).toBe("unscored");
  });
});

describe("compare — colour", () => {
  it("matches a design hex against the browser's rgb()", () => {
    expect(compare("#166534", "rgb(22, 101, 52)")).toBe("match");
  });

  it("matches regardless of hex case", () => {
    expect(compare("#DCFCE7", "rgb(220, 252, 231)")).toBe("match");
  });

  it("fails a genuinely different colour", () => {
    // The orange decoy that nearly got screenshotted instead of this app.
    expect(compare("#166534", "rgb(226, 102, 29)")).toBe("differs");
  });

  it("fails a near-miss rather than rounding it away", () => {
    expect(compare("#166534", "rgb(22, 101, 53)")).toBe("differs");
  });
});

describe("compare — alpha colour formatting", () => {
  it("matches the overlay scrim across `.45` vs `0.45` and comma spacing", () => {
    expect(compare("rgba(15,23,42,.45)", "rgba(15, 23, 42, 0.45)")).toBe("match");
  });

  it("matches space-separated rgb() against comma-separated rgba()", () => {
    expect(compare("rgb(0 0 0 / .05)", "rgba(0, 0, 0, 0.05)")).toBe("match");
  });

  it("fails when the alpha genuinely differs", () => {
    expect(compare("rgba(15,23,42,.45)", "rgba(15, 23, 42, 0.35)")).toBe("differs");
  });
});

describe("compare — Tailwind's composed box-shadow chain", () => {
  // Verbatim from getComputedStyle in Chrome for `shadow-xs` on a card.
  const COMPUTED_XS =
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px";

  const COMPUTED_SM =
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px";

  const COMPUTED_XL =
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, " +
    "rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px";

  it("matches shadow-xs — the design's Rest elevation", () => {
    expect(compare("0 1px 2px 0 rgba(0, 0, 0, 0.05)", COMPUTED_XS)).toBe("match");
  });

  it("matches shadow-sm — the design's Control elevation, two segments", () => {
    expect(
      compare("0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)", COMPUTED_SM),
    ).toBe("match");
  });

  it("matches shadow-xl — the design's Sheet/dialog elevation, negative spreads", () => {
    expect(
      compare(
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        COMPUTED_XL,
      ),
    ).toBe("match");
  });

  it("still fails when a shadow is genuinely aliased one step", () => {
    // Asking for Rest (shadow-xs) but being handed Control (shadow-sm).
    expect(compare("0 1px 2px 0 rgba(0, 0, 0, 0.05)", COMPUTED_SM)).toBe("differs");
  });

  it("still fails when only the shadow alpha is wrong", () => {
    const wrongAlpha = COMPUTED_XS.replace("0.05", "0.15");
    expect(compare("0 1px 2px 0 rgba(0, 0, 0, 0.05)", wrongAlpha)).toBe("differs");
  });

  it("still fails when only an offset is wrong", () => {
    const wrongOffset = COMPUTED_XS.replace("0px 1px 2px 0px", "0px 2px 2px 0px");
    expect(compare("0 1px 2px 0 rgba(0, 0, 0, 0.05)", wrongOffset)).toBe("differs");
  });

  it("does not treat an all-transparent chain as equal to a real shadow", () => {
    const none = "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px";
    expect(compare("0 1px 2px 0 rgba(0, 0, 0, 0.05)", none)).toBe("differs");
  });
});

describe("compare — plain scalars", () => {
  it("matches identical lengths", () => {
    expect(compare("6px", "6px")).toBe("match");
    expect(compare("28.8px", "28.8px")).toBe("match");
  });

  it("normalises whitespace and case but not magnitude", () => {
    expect(compare("  700 ", "700")).toBe("match");
    expect(compare("28.8px", "32px")).toBe("differs");
  });

  it("reports the rounded-full radius exception as a genuine difference", () => {
    // Design declares 999px; Tailwind v4 ships calc(infinity * 1px).
    expect(compare("999px", "33554400px")).toBe("differs");
  });
});

/* ------------------------------------------------- signed-exception mechanism */

describe("compare — numeric normalisation", () => {
  it("treats scientific and plain notation as the same length", () => {
    // docs/tokens.md §9 records `33554400px`; Chrome emits `3.35544e+07px`.
    expect(compare("33554400px", "3.35544e+07px")).toBe("match");
  });

  it("does not collapse genuinely different magnitudes", () => {
    expect(compare("999px", "3.35544e+07px")).toBe("differs");
    expect(compare("28.8px", "32px")).toBe("differs");
  });

  it("does not equate the same number in different units", () => {
    expect(compare("16px", "16rem")).toBe("differs");
  });
});

describe("registry integrity", () => {
  it("every registered exception targets a live check", () => {
    expect(staleExceptions(liveCheckIds())).toEqual([]);
  });

  it("reports a stale id as an error rather than ignoring it", () => {
    const live = new Set(["radius:rounded-full"]); // E1–E3's targets removed
    const stale = staleExceptions(live);
    expect(stale.map((e) => e.id)).toEqual(["E1", "E2", "E3"]);
  });

  it("seeds E1–E4 exactly as docs/tokens.md §9 records them", () => {
    expect(EXCEPTIONS.map((e) => [e.id, e.designValue, e.acceptedValue, e.category])).toEqual([
      ["E1", "28.8px", "32px", "typography"],
      ["E2", "26px", "28px", "typography"],
      ["E3", "22.4px", "20px", "typography"],
      ["E4", "999px", "33554400px", "radius"],
    ]);
  });

  it("has all four signed 2026-08-06, matching §9's sign-off table", () => {
    expect(unsignedExceptions()).toEqual([]);
    expect(EXCEPTIONS.map((e) => [e.id, e.signedOn])).toEqual([
      ["E1", "2026-08-06"],
      ["E2", "2026-08-06"],
      ["E3", "2026-08-06"],
      ["E4", "2026-08-06"],
    ]);
  });
});

describe("compare — accepted verdict", () => {
  const E3 = "type:Body.leading";

  /** E3 as if it had been signed, without mutating the real registry. */
  const signedE3 = () => {
    const e = EXCEPTIONS.find((x) => x.id === "E3");
    expect(e).toBeDefined();
    return { ...e!, signedOn: "2026-08-06" };
  };

  it("does NOT accept while the exception is unsigned", () => {
    // The signature is the gate. E1–E4 are signed now, so this pins the rule against an
    // explicitly unsigned copy — a future exception added without a date must not pass.
    const unsigned = { ...signedE3(), signedOn: null };
    expect(verdictFor("22.4px", "20px", unsigned)).toBe("differs");
  });

  it("accepts the exact accepted value once signed", () => {
    expect(verdictFor("22.4px", "20px", signedE3())).toBe("accepted");
    // And through the real registry, now that E3 carries a date.
    expect(compare("22.4px", "20px", E3)).toBe("accepted");
  });

  it("still fails a value that drifted away from the accepted one", () => {
    // An exception licenses ONE specific difference, not the check.
    expect(verdictFor("22.4px", "18px", signedE3())).toBe("differs");
    expect(verdictFor("22.4px", "24px", signedE3())).toBe("differs");
    expect(verdictFor("22.4px", "20.5px", signedE3())).toBe("differs");
  });

  it("still reports an exact match as `match`, not `accepted`", () => {
    expect(verdictFor("22.4px", "22.4px", signedE3())).toBe("match");
  });

  it("does not let one exception cover a different check", () => {
    // Same accepted value, wrong target — the lookup must miss, so no acceptance.
    expect(compare("22.4px", "20px", "type:Table row primary.leading")).toBe("differs");
    expect(exceptionFor("type:Table row primary.leading")).toBeUndefined();
  });

  it("accepts E4 across the notation gap between §9 and Chrome", () => {
    const e4 = EXCEPTIONS.find((e) => e.id === "E4");
    expect(e4).toBeDefined();
    const signed = { ...e4!, signedOn: "2026-08-06" };
    // §9 records 33554400px; Chrome emits 3.35544e+07px.
    expect(verdictFor("999px", "3.35544e+07px", signed)).toBe("accepted");
  });

  it("ignores the registry entirely when no checkId is supplied", () => {
    expect(compare("22.4px", "20px")).toBe("differs");
  });
});

describe("scoring", () => {
  const measured = {
    "Body.size": "14px",
    "Body.weight": "400",
    "Body.leading": "20px",
    "rounded-sm": "6px",
  };

  it("excludes unscored rows from the denominator", () => {
    const results = runChecks(measured).filter((r) => r.id.startsWith("type:Body"));
    const scored = results.filter((r) => r.verdict !== "unscored");
    // Body declares size, weight and leading; tracking is design-silent.
    expect(scored).toHaveLength(3);
  });

  it("counts (exact + accepted) over total", () => {
    const score = {
      category: "typography" as const,
      total: 24,
      exact: 21,
      accepted: 3,
      acceptedIds: ["E1", "E2", "E3"],
      failed: 0,
      failedLabels: [],
      percent: 100,
    };
    expect(formatScore(score)).toBe("Typography 100% (24/24 — 21 exact, 3 accepted: E1 E2 E3)");
  });

  it("keeps failures visible in the formatted line", () => {
    const score = {
      category: "radius" as const,
      total: 6,
      exact: 5,
      accepted: 0,
      acceptedIds: [],
      failed: 1,
      failedLabels: ["rounded-full"],
      percent: (5 / 6) * 100,
    };
    expect(formatScore(score)).toBe("Radius 83.3% (5/6 — 5 exact, 1 failing)");
  });
});
