/**
 * Registry of signed exceptions — rows where the app's resolved value does NOT equal
 * the design's declared value and the difference is accepted rather than fixed.
 *
 * Seeded verbatim from `docs/tokens.md` §9. Values are READ from §9, never re-derived:
 * if §9 and the comparator disagree, that is a finding to raise, not a number to quietly
 * adjust here. §9 stays the single source of truth.
 *
 * An exception only takes effect once `signedOn` is set. While it is null the row fails
 * normally and the category score reflects that — which is the point: the signature is a
 * gate, not a formality. §9's sign-off table is currently empty for all four.
 */

export type ExceptionCategory = "colour" | "typography" | "radius" | "shadow" | "spacing" | "other";

export interface SignedException {
  /** Stable identifier, matching §9. */
  id: string;
  category: ExceptionCategory;
  /** Check id this applies to. Must match a live check — see `staleExceptions()`. */
  target: string;
  /** What the design declares, per §9. */
  designValue: string;
  /** The measured value being accepted, per §9. */
  acceptedValue: string;
  /** Why it is accepted rather than fixed. Condensed from §9. */
  reason: string;
  /** ISO date. `null` = not yet signed, so the exception does NOT apply. */
  signedOn: string | null;
}

export const EXCEPTIONS: readonly SignedException[] = [
  {
    id: "E1",
    category: "typography",
    target: "type:Page title.leading",
    designValue: "28.8px",
    acceptedValue: "32px",
    reason:
      "Closing it means overriding --text-2xl, which every primitive consumes. The design states the rule directly: 'No type-scale overrides.' Components apply leading-[1.2] per role instead.",
    signedOn: "2026-08-06",
  },
  {
    id: "E2",
    category: "typography",
    target: "type:Record title.leading",
    designValue: "26px",
    acceptedValue: "28px",
    reason:
      "Same root cause as E1 — overriding --text-xl would re-lead every text-xl string in every primitive. Components apply leading-[1.3] per role.",
    signedOn: "2026-08-06",
  },
  {
    id: "E3",
    category: "typography",
    target: "type:Body.leading",
    designValue: "22.4px",
    acceptedValue: "20px",
    reason:
      "Re-leading --text-sm to fix prose would change the vertical rhythm of every control in the app. Components apply leading-[1.6] per role — note leading-relaxed is 1.625, 0.35px off.",
    signedOn: "2026-08-06",
  },
  {
    id: "E4",
    category: "radius",
    target: "radius:rounded-full",
    designValue: "999px",
    acceptedValue: "33554400px",
    reason:
      "Both render as a full pill below ~2000px; no reachable viewport differs. The design writes 999px only because its bundle predates Tailwind v4's static utility, and --radius-full is a bridge name, not a contract token.",
    signedOn: "2026-08-06",
  },
] as const;

/** The exception governing a check, if one is registered — signed or not. */
export function exceptionFor(checkId: string): SignedException | undefined {
  return EXCEPTIONS.find((e) => e.target === checkId);
}

/**
 * Registry entries whose `target` matches no live check.
 *
 * A stale id is an ERROR, never a silent pass: it means the check was renamed or removed
 * while the exception stayed behind, so a difference could be waved through by an
 * exception that no longer describes anything real.
 */
export function staleExceptions(liveCheckIds: ReadonlySet<string>): SignedException[] {
  return EXCEPTIONS.filter((e) => !liveCheckIds.has(e.target));
}

/** Exceptions that are registered but not yet signed, so are not in force. */
export function unsignedExceptions(): SignedException[] {
  return EXCEPTIONS.filter((e) => e.signedOn === null);
}
