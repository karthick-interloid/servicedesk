/**
 * The design's declared values, in `Design System.dc.html`'s own presentation order:
 * Color → shadcn contract → Typography → Spacing & radius → Elevation → Breakpoints.
 *
 * `expected` is the value the design DECLARES. The board resolves what the app
 * ACTUALLY computes and diffs the two. A null `expected` means the design is silent
 * — those rows are reported, never scored.
 *
 * Sources: docs/tokens.md (verbatim census) and docs/treatments.md (application).
 */

import {
  type ExceptionCategory,
  type SignedException,
  exceptionFor,
} from "@/features/token-audit/exceptions";

export type Verdict = "match" | "accepted" | "differs" | "unscored";

/** A CSS custom property the app defines, with the design value it should carry. */
export interface ColorToken {
  /** Custom property name, e.g. "--primary". Null for design values with no token. */
  varName: string | null;
  /** Literal fallback used to paint the swatch when varName is null. */
  literal?: string;
  label: string;
  /** Design-declared value, light theme. Null = design is silent. */
  expected: string | null;
  /** How the design uses it — from the page's own `shadcnRows` / markup. */
  use: string;
}

export interface ColorGroup {
  id: string;
  title: string;
  note: string;
  tokens: ColorToken[];
}

export const COLOR_GROUPS: ColorGroup[] = [
  {
    id: "contract",
    title: "shadcn token contract",
    note: "18 names. Every one already existed in the starter — no renaming was required. `use` column is the design page's own wording.",
    tokens: [
      {
        varName: "--background",
        label: "background",
        expected: "#f8fafc",
        use: "App canvas. The frame behind every screen.",
      },
      {
        varName: "--foreground",
        label: "foreground",
        expected: "#0f172a",
        use: "Default text.",
      },
      {
        varName: "--card",
        label: "card",
        expected: "#ffffff",
        use: "Every panel, table shell, stat tile, settings card.",
      },
      {
        varName: "--card-foreground",
        label: "card-foreground",
        expected: "#0f172a",
        use: "Text on panels.",
      },
      {
        varName: "--popover",
        label: "popover",
        expected: "#ffffff",
        use: "Notification tray, avatar menu, column picker.",
      },
      {
        varName: "--popover-foreground",
        label: "popover-foreground",
        expected: "#0f172a",
        use: "Text in overlays.",
      },
      {
        varName: "--primary",
        label: "primary",
        expected: "#166534",
        use: "Primary button, selected row, links. The one action colour.",
      },
      {
        varName: "--primary-foreground",
        label: "primary-foreground",
        expected: "#ffffff",
        use: "Label on the primary fill — 7.1:1.",
      },
      {
        varName: "--secondary",
        label: "secondary",
        expected: "#f1f5f9",
        use: "Secondary button hover, filter chips, table header band.",
      },
      {
        varName: "--secondary-foreground",
        label: "secondary-foreground",
        expected: "#334155",
        use: "Neutral badge text, nav labels.",
      },
      {
        varName: "--muted",
        label: "muted",
        expected: "#f1f5f9",
        use: "Row hairlines, ghost hover, sunken fills.",
      },
      {
        varName: "--muted-foreground",
        label: "muted-foreground",
        expected: "#64748b",
        use: "Hints, timestamps, placeholders, empty-state body.",
      },
      {
        varName: "--accent",
        label: "accent",
        expected: "#dcfce7",
        use: "Active nav item, active tab, selected chip, menu highlight.",
      },
      {
        varName: "--accent-foreground",
        label: "accent-foreground",
        expected: "#166534",
        use: "Ink on the brand-soft surface — 6.5:1.",
      },
      {
        varName: "--destructive",
        label: "destructive",
        expected: "#dc2626",
        use: "Delete and revoke, breach badges, failed invoices.",
      },
      {
        varName: "--border",
        label: "border",
        expected: "#e2e8f0",
        use: "Card and table borders. Inner separators drop to slate-100.",
      },
      {
        varName: "--input",
        label: "input",
        expected: "#cbd5e1",
        use: "Input, select, textarea and row-checkbox borders at rest.",
      },
      {
        varName: "--ring",
        label: "ring",
        expected: "#16a34a",
        use: "focus-visible border + 3px halo. 3.3:1 on white.",
      },
    ],
  },
  {
    id: "sidebar",
    title: "Sidebar contract",
    note: "`--sidebar-primary` is currently inert: radix-nova's sidebar.tsx never reads it (0 references).",
    tokens: [
      {
        varName: "--sidebar",
        label: "sidebar",
        expected: "#ffffff",
        use: "Sidebar surface, expanded or railed.",
      },
      {
        varName: "--sidebar-foreground",
        label: "sidebar-foreground",
        expected: "#334155",
        use: "Idle item labels.",
      },
      {
        varName: "--sidebar-primary",
        label: "sidebar-primary",
        expected: "#166534",
        use: "Org avatar tile, count pills, sidebar CTA.",
      },
      {
        varName: "--sidebar-primary-foreground",
        label: "sidebar-primary-foreground",
        expected: "#ffffff",
        use: "Ink on that tile.",
      },
      {
        varName: "--sidebar-accent",
        label: "sidebar-accent",
        expected: "#dcfce7",
        use: "Active AND hovered nav item — see conflict T1.",
      },
      {
        varName: "--sidebar-accent-foreground",
        label: "sidebar-accent-foreground",
        expected: "#166534",
        use: "Brand ink on the active fill.",
      },
      {
        varName: "--sidebar-border",
        label: "sidebar-border",
        expected: "#f1f5f9",
        use: "Header/footer dividers, group separators.",
      },
      {
        varName: "--sidebar-ring",
        label: "sidebar-ring",
        expected: "#16a34a",
        use: "Focus ring on rail buttons.",
      },
    ],
  },
  {
    id: "charts",
    title: "Chart series",
    note: "Five series, no two from the same hue family. `--chart-muted` sits outside the ramp: context, not a sixth series.",
    tokens: [
      {
        varName: "--chart-1",
        label: "chart-1",
        expected: "#166534",
        use: "Primary series — volume, this period.",
      },
      {
        varName: "--chart-2",
        label: "chart-2",
        expected: "#16a34a",
        use: "Comparison — previous period.",
      },
      {
        varName: "--chart-3",
        label: "chart-3",
        expected: "#64748b",
        use: "Neutral / total / benchmark line.",
      },
      { varName: "--chart-4", label: "chart-4", expected: "#4f46e5", use: "Secondary category." },
      { varName: "--chart-5", label: "chart-5", expected: "#d97706", use: "At risk." },
      {
        varName: "--chart-muted",
        label: "chart-muted",
        expected: "#cbd5e1",
        use: "Out-of-hours bars in Reports.",
      },
    ],
  },
  {
    id: "semantic",
    title: "Semantic triples — base · soft · strong",
    note: "Six groups shadcn has no token for. base = dots and fills · soft = the pill surface · strong = its text.",
    tokens: [
      {
        varName: "--success",
        label: "success",
        expected: "#12a150",
        use: "SLA-met dot, solved fill.",
      },
      {
        varName: "--success-soft",
        label: "success-soft",
        expected: "#e4f6ec",
        use: "Success pill surface.",
      },
      {
        varName: "--success-strong",
        label: "success-strong",
        expected: "#0b7a3b",
        use: "Success pill text — 4.8:1.",
      },
      {
        varName: "--warning",
        label: "warning",
        expected: "#d97706",
        use: "At-risk dot, note-author avatar.",
      },
      {
        varName: "--warning-soft",
        label: "warning-soft",
        expected: "#fffbeb",
        use: "Warning pill surface.",
      },
      {
        varName: "--warning-strong",
        label: "warning-strong",
        expected: "#b45309",
        use: "Warning pill text — 4.8:1, at the limit.",
      },
      {
        varName: "--info",
        label: "info",
        expected: "#4f46e5",
        use: "Info dot. Deliberately NOT brand-derived.",
      },
      {
        varName: "--info-soft",
        label: "info-soft",
        expected: "#eef2ff",
        use: "Info pill surface.",
      },
      {
        varName: "--info-strong",
        label: "info-strong",
        expected: "#3730a3",
        use: "Info pill text — 8.9:1.",
      },
      {
        varName: "--destructive-soft",
        label: "destructive-soft",
        expected: "#fef2f2",
        use: "Error pill and alert surface.",
      },
      {
        varName: "--destructive-strong",
        label: "destructive-strong",
        expected: "#b91c1c",
        use: "Error pill text — 5.9:1.",
      },
      { varName: "--note", label: "note", expected: "#fef3c7", use: "Internal-note surface." },
      {
        varName: "--note-border",
        label: "note-border",
        expected: "#fde68a",
        use: "Internal-note border.",
      },
      {
        varName: "--note-foreground",
        label: "note-foreground",
        expected: "#92400e",
        use: "Internal-note text — 6.4:1.",
      },
    ],
  },
  {
    id: "on-solid",
    title: "Text-on-solid — the fourth semantic",
    note: "The design declares only --destructive-foreground, and only by usage (the unread bell). The other three complete the quad; two are accessibility completions awaiting sign-off.",
    tokens: [
      {
        varName: "--destructive-foreground",
        label: "destructive-foreground",
        expected: "#ffffff",
        use: "Unread bell #DC2626/#fff — 4.8:1. Declared by usage.",
      },
      {
        varName: "--info-foreground",
        label: "info-foreground",
        expected: null,
        use: "Derived — no usage in the page. #fff = 6.3:1, passes.",
      },
      {
        varName: "--success-foreground",
        label: "success-foreground",
        expected: null,
        use: "⚠ Completion. Design-implied #fff = 3.4:1 FAILS; #0F172A = 5.3:1.",
      },
      {
        varName: "--warning-foreground",
        label: "warning-foreground",
        expected: null,
        use: "⚠ Completion. Design renders #fff on the amber avatar = 3.2:1 FAILS; #0F172A = 5.6:1.",
      },
    ],
  },
  {
    id: "no-token",
    title: "Design values with NO token",
    note: "Declared and used by the design, but the page's own 39-name addition list does not include them. Rendered as literals so the gaps are visible — these are the 'Missing tokens' rows.",
    tokens: [
      {
        varName: null,
        literal: "#15803d",
        label: "primary hover (green-700)",
        expected: "#15803d",
        use: "Primary button hover. Design expresses it as hover:bg-primary/90.",
      },
      {
        varName: null,
        literal: "#14532d",
        label: "primary pressed (green-900)",
        expected: "#14532d",
        use: "Primary button active + link hover. active:bg-green-900.",
      },
      {
        varName: null,
        literal: "#475569",
        label: "body copy (slate-600)",
        expected: "#475569",
        use: "All prose. Between --foreground and --muted-foreground. 7.6:1.",
      },
      {
        varName: null,
        literal: "#f0fdf4",
        label: "row hover (green-50)",
        expected: "#f0fdf4",
        use: "Table row hover, agent bubble, unread tray row. 2% brand tint.",
      },
      {
        varName: null,
        literal: "#bbf7d0",
        label: "success alert border (green-200)",
        expected: "#bbf7d0",
        use: "Success banner border.",
      },
      {
        varName: null,
        literal: "#fecaca",
        label: "error alert border (red-200)",
        expected: "#fecaca",
        use: "Error banner border.",
      },
      {
        varName: null,
        literal: "#c7d2fe",
        label: "info alert border (indigo-200)",
        expected: "#c7d2fe",
        use: "Info banner border.",
      },
      {
        varName: null,
        literal: "#94a3b8",
        label: "caption / disabled (slate-400)",
        expected: "#94a3b8",
        use: "Eyebrows, captions. 2.6:1 — decorative only, never for meaning.",
      },
      {
        varName: null,
        literal: "rgba(15,23,42,.45)",
        label: "overlay scrim",
        expected: "rgba(15,23,42,.45)",
        use: "Behind every dialog, sheet and tray.",
      },
    ],
  },
];

/* ---------------------------------------------------------------- typography */

export interface TypeStep {
  role: string;
  /** Utilities only — exactly what the design's own snippet applies. */
  className: string;
  sample: string;
  expectedSize: string;
  expectedWeight: string;
  /** Design-declared line-height in px. Null = design is silent on it. */
  expectedLineHeight: string | null;
  expectedTracking: string | null;
}

export const TYPE_STEPS: TypeStep[] = [
  {
    role: "Page title",
    className: "text-2xl font-bold tracking-tight",
    sample: "Ticket queue",
    expectedSize: "24px",
    expectedWeight: "700",
    expectedLineHeight: "28.8px",
    expectedTracking: "-0.6px",
  },
  {
    role: "Record title",
    className: "text-xl font-bold tracking-tight",
    sample: "Duplicate charge on invoice INV-2291",
    expectedSize: "20px",
    expectedWeight: "700",
    expectedLineHeight: "26px",
    expectedTracking: "-0.5px",
  },
  {
    role: "Section heading",
    className: "text-lg font-semibold",
    sample: "When is your team on shift?",
    expectedSize: "18px",
    expectedWeight: "600",
    expectedLineHeight: null,
    expectedTracking: null,
  },
  {
    role: "Card title",
    className: "text-base font-semibold",
    sample: "Business hours",
    expectedSize: "16px",
    expectedWeight: "600",
    expectedLineHeight: null,
    expectedTracking: null,
  },
  {
    role: "Body",
    className: "text-sm",
    sample:
      "Body copy. Short sentences, active voice, outcome first — never more than about 74 characters a line.",
    expectedSize: "14px",
    expectedWeight: "400",
    expectedLineHeight: "22.4px",
    expectedTracking: null,
  },
  {
    role: "Table row primary",
    className: "text-sm font-semibold",
    sample: "Priya Raman · Meridian Labs",
    expectedSize: "14px",
    expectedWeight: "600",
    expectedLineHeight: null,
    expectedTracking: null,
  },
  {
    role: "Meta & caption",
    className: "text-xs",
    sample: "Updated 12 minutes ago · 3 of 24 tickets",
    expectedSize: "12px",
    expectedWeight: "400",
    expectedLineHeight: null,
    expectedTracking: null,
  },
  {
    role: "Eyebrow · nav group",
    className: "text-xs font-bold uppercase tracking-widest",
    sample: "Settings",
    expectedSize: "12px",
    expectedWeight: "700",
    expectedLineHeight: null,
    expectedTracking: "1.2px",
  },
  {
    role: "IDs & metrics",
    className: "font-mono text-sm tabular-nums",
    sample: "#4821   $1,740.00   103.21.44.9   sk_live_····8f2a",
    expectedSize: "14px",
    expectedWeight: "400",
    expectedLineHeight: null,
    expectedTracking: null,
  },
];

/* -------------------------------------------------------------------- radius */

export interface RadiusStep {
  className: string;
  label: string;
  expected: string;
  use: string;
}

export const RADIUS_STEPS: RadiusStep[] = [
  { className: "rounded-sm", label: "rounded-sm", expected: "6px", use: "input, badge" },
  { className: "rounded-md", label: "rounded-md", expected: "8px", use: "nav item, tile" },
  { className: "rounded-lg", label: "rounded-lg", expected: "10px", use: "button, bubble" },
  { className: "rounded-xl", label: "rounded-xl", expected: "14px", use: "panel, table" },
  { className: "rounded-2xl", label: "rounded-2xl", expected: "16px", use: "plan card" },
  { className: "rounded-full", label: "rounded-full", expected: "999px", use: "pill, switch" },
];

/* ------------------------------------------------------------------ elevation */

export interface ShadowRole {
  className: string;
  role: string;
  expected: string;
}

/** The four the design assigns by role. */
export const SHADOW_ROLES: ShadowRole[] = [
  {
    className: "shadow-xs",
    role: "Rest — every card at rest",
    expected: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  {
    className: "shadow-sm",
    role: "Control",
    expected: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  },
  {
    className: "shadow-lg",
    role: "Overlay — popover, menu",
    expected: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  },
  {
    className: "shadow-xl",
    role: "Sheet, dialog",
    expected: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  },
];

/** The full utility ladder — renders unassigned steps so any aliasing shift shows. */
export const SHADOW_LADDER = [
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const;

/* -------------------------------------------------------------------- spacing */

export interface SpaceStep {
  className: string;
  label: string;
  expected: string;
  use: string;
}

export const SPACE_STEPS: SpaceStep[] = [
  { className: "w-1", label: "gap-1 · 4", expected: "4px", use: "icon-to-label, dot gaps" },
  { className: "w-2", label: "gap-2 · 8", expected: "8px", use: "chip rows, button clusters" },
  { className: "w-2.5", label: "gap-2.5 · 10", expected: "10px", use: "table cell gap" },
  { className: "w-3", label: "gap-3 · 12", expected: "12px", use: "stacked fields" },
  { className: "w-4", label: "gap-4 · 16", expected: "16px", use: "card padding, mobile page pad" },
  { className: "w-5", label: "gap-5 · 20", expected: "20px", use: "section gap" },
  { className: "w-6", label: "p-6 · 24", expected: "24px", use: "desktop page padding" },
  { className: "w-8", label: "p-8 · 32", expected: "32px", use: "ultra-wide page padding" },
  { className: "w-12", label: "p-12 · 48", expected: "48px", use: "ultra-wide, ≥1800px" },
];

/* ---------------------------------------------------------------- breakpoints */

export const BREAKPOINTS = [
  {
    name: "base",
    width: "< 640",
    behaviour: "Queue becomes cards, sidebar becomes a 272px sheet, 44px targets, p-4",
  },
  {
    name: "sm:",
    width: "≥ 640",
    behaviour: "Two-column forms, 40px controls, filter bar stops wrapping",
  },
  { name: "md:", width: "≥ 768", behaviour: "Table returns in place of cards, 36px controls, p-6" },
  {
    name: "lg:",
    width: "≥ 1024",
    behaviour: "Sidebar is permanent — 256px expanded, 72px icon rail collapsed",
  },
  { name: "xl:", width: "≥ 1280", behaviour: "All six fixed queue tracks fit" },
  {
    name: "2xl:",
    width: "≥ 1536",
    behaviour: "Reports go three-up; room for the picker's optional columns",
  },
  {
    name: "wide:",
    width: "≥ 1800",
    behaviour: "288px sidebar, p-8/p-12, content capped at 2040px — the one added step",
  },
] as const;

/* ------------------------------------------------------------------- helpers */

/** #rrggbb → "rgb(r, g, b)" as the browser serialises it, for verbatim comparison. */
export function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return null;
  const int = Number.parseInt(m[1], 16);
  return `rgb(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255})`;
}

/** `rgb(0 0 0 / .05)`, `rgba(0,0,0,0.05)`, `rgba(0, 0, 0, 0.05)` → one canonical form. */
function canonColor(raw: string): string {
  const m = /rgba?\(([^)]*)\)/.exec(raw);
  if (!m?.[1]) return raw.trim().toLowerCase();
  const parts = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map((x) => String(Number.parseFloat(x)));
  while (parts.length < 4) parts.push("1");
  return `rgba(${parts.slice(0, 4).join(",")})`;
}

/**
 * Canonicalises a box-shadow (and, incidentally, a bare colour).
 *
 * Two things make a naive string compare useless here:
 *  1. Tailwind v4 composes `box-shadow` from --tw-ring-offset-shadow, --tw-ring-shadow,
 *     --tw-inset-shadow, --tw-inset-ring-shadow and --tw-shadow, so the computed value
 *     carries four `rgba(0, 0, 0, 0) 0px 0px 0px 0px` placeholders before the real one.
 *  2. The browser serialises the colour FIRST (`rgba(…) 0px 1px 2px 0px`); CSS authors
 *     write it LAST (`0 1px 2px 0 rgba(…)`).
 * Both are serialisation artefacts, not value differences.
 */
function canonShadow(raw: string): string {
  return raw
    .split(/,(?![^(]*\))/)
    .map((seg) => {
      const colourMatch = /rgba?\([^)]*\)/.exec(seg);
      const colour = colourMatch?.[0] ? canonColor(colourMatch[0]) : "";
      const rest = colourMatch?.[0] ? seg.replace(colourMatch[0], " ") : seg;
      const nums = (rest.match(/-?\d*\.?\d+/g) ?? []).map((n) => String(Number.parseFloat(n)));
      return { colour, nums };
    })
    .filter(({ colour, nums }) => !(colour === "rgba(0,0,0,0)" && nums.every((n) => n === "0")))
    .map(({ colour, nums }) => `${nums.join(" ")} ${colour}`.trim())
    .join(", ");
}

/**
 * `33554400px` and `3.35544e+07px` are the same length; Chrome emits the second for
 * `calc(infinity * 1px)` while docs/tokens.md §9 records the first. Parsing to a number
 * before comparing also keeps the registry independent of engine serialisation, which
 * differs between Chrome, Firefox and Safari for very large and very small values.
 * Returns null for anything that is not a bare `<number><unit>`.
 */
function canonNumeric(raw: string): string | null {
  const m = /^(-?\d*\.?\d+(?:e[+-]?\d+)?)([a-z%]*)$/i.exec(raw.trim());
  if (!m?.[1]) return null;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return `${n}${(m[2] ?? "").toLowerCase()}`;
}

/** True when two CSS values are the same VALUE, whatever their serialisation. */
function valuesEqual(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  if (norm(a) === norm(b)) return true;

  const aNum = canonNumeric(a);
  const bNum = canonNumeric(b);
  if (aNum !== null && bNum !== null) return aNum === bNum;

  if (/rgba?\(/.test(a) && /rgba?\(/.test(b)) return canonShadow(a) === canonShadow(b);
  return false;
}

/**
 * Compare a design-declared value against a browser-computed one.
 *
 * - `match`    — the same VALUE. Serialisation differences (hex vs rgb, `.45` vs `0.45`,
 *                `3.35544e+07px` vs `33554400px`, Tailwind's composed shadow chain and its
 *                colour-first ordering) are normalised away.
 * - `accepted` — a genuine mismatch, but one a SIGNED exception in the registry covers, and
 *                the measured value is exactly the value that exception accepts. Drift away
 *                from the accepted value fails normally — an exception licenses one specific
 *                difference, not the check.
 * - `differs`  — anything else.
 *
 * An unsigned exception (`signedOn: null`) does not apply. The signature is the gate.
 */
export function compare(
  expected: string | null,
  actual: string | undefined,
  checkId?: string,
): Verdict {
  return verdictFor(expected, actual, checkId === undefined ? undefined : exceptionFor(checkId));
}

/**
 * The comparison itself, with the governing exception passed in rather than looked up.
 * `compare()` is the thin wrapper that resolves the exception from the registry; this is
 * where the rules live, and it is what lets the signed path be exercised directly.
 */
export function verdictFor(
  expected: string | null,
  actual: string | undefined,
  exception?: SignedException,
): Verdict {
  if (expected === null || actual === undefined || actual === "") return "unscored";
  if (valuesEqual(expected, actual)) return "match";

  const asRgb = hexToRgb(expected);
  if (asRgb && valuesEqual(asRgb, actual)) return "match";

  if (exception && exception.signedOn !== null && valuesEqual(exception.acceptedValue, actual)) {
    return "accepted";
  }
  return "differs";
}

/* -------------------------------------------------------------------- scoring */

/**
 * One comparison the board performs. `id` is the stable key an exception targets;
 * `measuredKey` is where `useMeasured` filed the browser's answer. They differ on
 * purpose — renaming a display key must not silently orphan an exception.
 */
export interface CheckResult {
  id: string;
  category: ExceptionCategory;
  label: string;
  expected: string | null;
  actual: string | undefined;
  verdict: Verdict;
}

interface CheckSpec {
  id: string;
  category: ExceptionCategory;
  label: string;
  measuredKey: string;
  expected: string | null;
}

/** Every check the board performs, independent of any measurement. */
function checkSpecs(): CheckSpec[] {
  const specs: CheckSpec[] = [];

  for (const group of COLOR_GROUPS) {
    for (const t of group.tokens) {
      const key = t.varName ?? `lit:${t.literal}`;
      specs.push({
        id: `colour:${key}`,
        category: "colour",
        label: t.varName ?? t.label,
        measuredKey: key,
        expected: t.expected,
      });
    }
  }

  for (const s of TYPE_STEPS) {
    specs.push({
      id: `type:${s.role}.size`,
      category: "typography",
      label: `${s.role} — size`,
      measuredKey: `${s.role}.size`,
      expected: s.expectedSize,
    });
    specs.push({
      id: `type:${s.role}.weight`,
      category: "typography",
      label: `${s.role} — weight`,
      measuredKey: `${s.role}.weight`,
      expected: s.expectedWeight,
    });
    specs.push({
      id: `type:${s.role}.leading`,
      category: "typography",
      label: `${s.role} — leading`,
      measuredKey: `${s.role}.leading`,
      expected: s.expectedLineHeight,
    });
    specs.push({
      id: `type:${s.role}.tracking`,
      category: "typography",
      label: `${s.role} — tracking`,
      measuredKey: `${s.role}.tracking`,
      expected: s.expectedTracking,
    });
  }

  for (const r of RADIUS_STEPS) {
    specs.push({
      id: `radius:${r.label}`,
      category: "radius",
      label: r.label,
      measuredKey: r.label,
      expected: r.expected,
    });
  }

  for (const s of SPACE_STEPS) {
    specs.push({
      id: `spacing:${s.label}`,
      category: "spacing",
      label: s.label,
      measuredKey: s.label,
      expected: s.expected,
    });
  }

  for (const s of SHADOW_ROLES) {
    specs.push({
      id: `shadow:${s.className}`,
      category: "shadow",
      label: s.className,
      measuredKey: `role:${s.className}`,
      expected: s.expected,
    });
  }

  return specs;
}

/** The id of every live check. An exception targeting anything else is stale. */
export function liveCheckIds(): ReadonlySet<string> {
  return new Set(checkSpecs().map((s) => s.id));
}

/** Run every check against a measurement set. */
export function runChecks(measured: Record<string, string>): CheckResult[] {
  return checkSpecs().map((spec) => {
    const actual = measured[spec.measuredKey];
    return {
      id: spec.id,
      category: spec.category,
      label: spec.label,
      expected: spec.expected,
      actual,
      verdict: compare(spec.expected, actual, spec.id),
    };
  });
}

export interface CategoryScore {
  category: ExceptionCategory;
  /** Scored checks — `unscored` rows are excluded from the denominator. */
  total: number;
  exact: number;
  accepted: number;
  acceptedIds: string[];
  failed: number;
  failedLabels: string[];
  /** (exact + accepted) / total, 0–100. */
  percent: number;
}

const CATEGORY_ORDER: ExceptionCategory[] = [
  "colour",
  "typography",
  "radius",
  "shadow",
  "spacing",
  "other",
];

export function scoreByCategory(results: CheckResult[]): CategoryScore[] {
  return CATEGORY_ORDER.map((category) => {
    const scored = results.filter((r) => r.category === category && r.verdict !== "unscored");
    const exactRows = scored.filter((r) => r.verdict === "match");
    const acceptedRows = scored.filter((r) => r.verdict === "accepted");
    const failedRows = scored.filter((r) => r.verdict === "differs");
    const total = scored.length;
    return {
      category,
      total,
      exact: exactRows.length,
      accepted: acceptedRows.length,
      acceptedIds: acceptedRows
        .map((r) => exceptionFor(r.id)?.id)
        .filter((id): id is string => id !== undefined),
      failed: failedRows.length,
      failedLabels: failedRows.map((r) => r.label),
      percent: total === 0 ? 100 : ((exactRows.length + acceptedRows.length) / total) * 100,
    };
  }).filter((s) => s.total > 0);
}

const TITLE: Record<ExceptionCategory, string> = {
  colour: "Colour",
  typography: "Typography",
  radius: "Radius",
  shadow: "Shadow",
  spacing: "Spacing",
  other: "Other",
};

/**
 * One line per category, keeping accepted exceptions visible rather than folding
 * them into the pass count:
 *   `Typography 100% (24/24 — 21 exact, 3 accepted: E1 E2 E3)`
 *   `Colour 100% (56/56 — 56 exact)`
 */
export function formatScore(s: CategoryScore): string {
  const pct = Number.isInteger(s.percent) ? `${s.percent}%` : `${s.percent.toFixed(1)}%`;
  const parts = [`${s.exact} exact`];
  if (s.accepted > 0) parts.push(`${s.accepted} accepted: ${s.acceptedIds.join(" ")}`);
  if (s.failed > 0) parts.push(`${s.failed} failing`);
  return `${TITLE[s.category]} ${pct} (${s.exact + s.accepted}/${s.total} — ${parts.join(", ")})`;
}
