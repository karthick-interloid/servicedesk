/**
 * Content transcribed from `Design System.dc.html` (project
 * c078da5b-9b87-4fe2-94a8-8410a9ca2f16), the canonical design-system page.
 *
 * Hex strings appearing here are the page's own *label text* — the documented value a reader
 * is meant to read off the swatch — never a style value. Every swatch paints from a token or
 * a stock Tailwind palette utility (see components-map.md §Doc-page boundary); nothing in this
 * file is applied as CSS.
 */

export interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Foundations",
    items: [
      { href: "#color", label: "Color" },
      { href: "#shadcn", label: "shadcn tokens" },
      { href: "#type", label: "Typography" },
      { href: "#space", label: "Spacing & radius" },
      { href: "#elevation", label: "Elevation & motion" },
      { href: "#layout", label: "Breakpoints" },
    ],
  },
  {
    label: "Components",
    items: [
      { href: "#buttons", label: "Buttons" },
      { href: "#badges", label: "Badges & tags" },
      { href: "#forms", label: "Form controls" },
      { href: "#cards", label: "Cards" },
      { href: "#alerts", label: "Alerts" },
      { href: "#skeletons", label: "Skeletons" },
      { href: "#loaders", label: "Loaders" },
      { href: "#nav", label: "Navigation" },
      { href: "#data", label: "Data display" },
      { href: "#feedback", label: "Feedback" },
      { href: "#icons", label: "Icons" },
      { href: "#overlays", label: "Overlays" },
      { href: "#inputs2", label: "Advanced inputs" },
      { href: "#tables", label: "Table anatomy" },
      { href: "#charts", label: "Charts" },
    ],
  },
  {
    label: "Patterns",
    items: [
      { href: "#shell", label: "Layout & shell" },
      { href: "#roles", label: "Roles & gating" },
    ],
  },
  {
    label: "Guidance",
    items: [
      { href: "#content", label: "Content & format" },
      { href: "#a11y", label: "Accessibility" },
      { href: "#dodont", label: "Do & don't" },
      { href: "#api", label: "Component API" },
      { href: "#custom", label: "Custom variables" },
    ],
  },
  { label: "Handoff", items: [{ href: "#nextjs", label: "Next.js setup" }] },
];

export const MASTHEAD_STATS = [
  { figure: "18", label: "shadcn tokens" },
  { figure: "41", label: "added variables" },
  { figure: "15", label: "component sections" },
  { figure: "7", label: "breakpoints" },
] as const;

/* ---------------------------------------------------------------------- colour */

/** `paint` is a utility class — a token where one exists, a palette step where the design is
 *  deliberately outside the contract. Never a hex. */
export interface Swatch {
  paint: string;
  title?: string;
  value: string;
  token?: string;
  caption?: string;
}

export const BRAND_RAMP: Swatch[] = [
  {
    paint: "bg-primary",
    title: "Base · default action · green-800",
    value: "#166534 · green-800",
    token: "--primary",
  },
  {
    paint: "bg-green-700",
    title: "Hover",
    value: "#15803D · green-700",
    token: "hover:bg-primary/90",
  },
  {
    paint: "bg-green-900",
    title: "Pressed · link hover",
    value: "#14532D · green-900",
    token: "active:bg-primary/80",
  },
  {
    paint: "bg-accent",
    title: "Soft · active nav, selected",
    value: "#E7F1F1 · selected surface",
    token: "--sidebar-accent",
  },
];

export const NEUTRAL_RAMP: Swatch[] = [
  { paint: "bg-white", value: "white", caption: "card, sidebar" },
  { paint: "bg-slate-50", value: "slate-50", caption: "page canvas" },
  { paint: "bg-slate-100", value: "slate-100", caption: "row hairline" },
  { paint: "bg-slate-200", value: "slate-200", caption: "border, skeleton" },
  { paint: "bg-slate-300", value: "slate-300", caption: "input border" },
  { paint: "bg-slate-400", value: "slate-400", caption: "caption, disabled" },
  { paint: "bg-slate-500", value: "slate-500", caption: "muted text" },
  { paint: "bg-slate-600", value: "slate-600", caption: "secondary text" },
  { paint: "bg-slate-700", value: "slate-700", caption: "nav label" },
  { paint: "bg-slate-800", value: "slate-800", caption: "harness divider" },
  { paint: "bg-slate-900", value: "slate-900", caption: "primary text, toast" },
  { paint: "bg-slate-950", value: "slate-950", caption: "shadow mix" },
];

export interface StatusTriple {
  base: string;
  soft: string;
  strong: string;
  tone: "success" | "warning" | "error" | "brand" | "info";
  sample: string;
  primitives: string;
  names: string;
}

export const STATUS_TRIPLES: StatusTriple[] = [
  {
    base: "bg-success",
    soft: "bg-success-soft",
    strong: "bg-success-strong",
    tone: "success",
    sample: "Solved",
    primitives: "green-600 · 50 · 800",
    names: "--success · -soft · -strong",
  },
  {
    base: "bg-warning",
    soft: "bg-warning-soft",
    strong: "bg-warning-strong",
    tone: "warning",
    sample: "1h 12m left",
    primitives: "amber-600 · 50 · 700",
    names: "--warning · -soft · -strong",
  },
  {
    base: "bg-destructive",
    soft: "bg-destructive-soft",
    strong: "bg-destructive-strong",
    tone: "error",
    sample: "Breached 26m",
    primitives: "red-600 · 50 · 700",
    names: "--destructive · -soft · -strong",
  },
  {
    base: "bg-primary",
    soft: "bg-accent",
    strong: "bg-primary",
    tone: "brand",
    sample: "Open",
    primitives: "green-800 · #E7F1F1 · teal-700",
    names: "--primary · --accent · --accent-foreground",
  },
  {
    base: "bg-info",
    soft: "bg-info-soft",
    strong: "bg-info-strong",
    tone: "info",
    sample: "Awaiting triage",
    primitives: "indigo-600 · 50 · 800",
    names: "--info · -soft · -strong",
  },
];

export const SPECIAL_SURFACES = [
  {
    surface: "bg-note border border-note-border text-note-foreground",
    label: "Internal note only your team sees",
    value: "amber-100 / 200 / 800",
  },
  {
    surface: "bg-foreground text-background",
    label: "Inverse — toast, tooltip",
    value: "slate-900 · inverse surface",
  },
  {
    surface: "bg-slate-950 text-slate-400",
    label: "Prototype harness shell",
    value: "slate-950 — chrome only, not app UI",
  },
] as const;

/* -------------------------------------------------------------- shadcn contract */

export const SHADCN_ROWS = [
  {
    token: "--background / --foreground",
    value: "slate-50 / 900",
    use: "App canvas and default text. The frame behind every screen.",
  },
  {
    token: "--card / --card-foreground",
    value: "white / slate-900",
    use: "Every panel, table shell, stat tile, settings card, auth card.",
  },
  {
    token: "--popover / --popover-foreground",
    value: "white / slate-900",
    use: "Notification tray, avatar menu, column picker, global search.",
  },
  {
    token: "--primary / --primary-foreground",
    value: "green-800 / white",
    use: "Primary button, selected row, links. The one action colour; focus uses the lighter --ring.",
  },
  {
    token: "--secondary / --secondary-foreground",
    value: "slate-100 / 700",
    use: "Secondary button hover, filter-bar chips, table header band.",
  },
  {
    token: "--muted / --muted-foreground",
    value: "slate-100 / 500",
    use: "Hints, timestamps, placeholders, empty-state body, disabled copy.",
  },
  {
    token: "--accent / --accent-foreground",
    value: "#E7F1F1 / teal-700",
    use: "Active nav item, active tab, selected chip. Badges keep green-100 — never this.",
  },
  {
    token: "--destructive",
    value: "red-600",
    use: "Delete and revoke actions, breach badges, failed invoices, field errors.",
  },
  {
    token: "--border",
    value: "slate-200",
    use: "Card and table borders. Inner row separators drop to slate-100.",
  },
  {
    token: "--input",
    value: "slate-300",
    use: "Input, select, textarea and row-checkbox borders at rest.",
  },
  {
    token: "--ring",
    value: "green-600",
    use: "focus-visible:ring-[3px] ring-ring/30 + border-ring — shadcn's own pattern.",
  },
  {
    token: "--radius",
    value: "0.625rem",
    use: "shadcn base. Derives sm 6 · md 8 · lg 10 · xl 14 — never restate them.",
  },
  {
    token: "--chart-1 … --chart-5",
    value: "green-800 · green-600 · slate-500 · indigo-600 · amber-600",
    use: "Volume, comparison, benchmark, category, at risk. Never rainbow.",
  },
  {
    token: "--sidebar / --sidebar-foreground",
    value: "white / slate-700",
    use: "Sidebar surface and idle item labels, expanded or railed.",
  },
  {
    token: "--sidebar-primary / -foreground",
    value: "green-800 / white",
    use: "Org avatar tile, count pills, sidebar CTA.",
  },
  {
    token: "--sidebar-accent / -foreground",
    value: "#E7F1F1 / teal-700",
    use: "Active and hovered nav item — fill plus ink, no left border.",
  },
  {
    token: "--sidebar-border",
    value: "slate-100",
    use: "Sidebar header and footer dividers, group separators.",
  },
  {
    token: "--sidebar-ring",
    value: "green-600",
    use: "Focus ring on rail buttons and the collapse toggle.",
  },
] as const;

/* ------------------------------------------------------------------ typography */

export const TYPE_ROWS = [
  {
    sample: "Ticket queue",
    cls: "text-2xl font-bold tracking-tight leading-[1.2]",
    spec: "text-2xl · 24px / 700 / tracking-tight",
    role: "Page title",
  },
  {
    sample: "Duplicate charge on invoice INV-2291",
    cls: "text-xl font-bold tracking-tight leading-[1.3]",
    spec: "text-xl · 20px / 700",
    role: "Record title",
  },
  {
    sample: "When is your team on shift?",
    cls: "text-lg font-semibold",
    spec: "text-lg · 18px / 600",
    role: "Section heading",
  },
  {
    sample: "Business hours",
    cls: "text-base font-semibold",
    spec: "text-base · 16px / 600",
    role: "Card title",
  },
  {
    sample:
      "Body copy. Short sentences, active voice, outcome first — never more than about 74 characters a line.",
    cls: "text-sm leading-[1.6] text-slate-600",
    spec: "text-sm · 14px / 400 / 1.6",
    role: "Body",
  },
  {
    sample: "Priya Raman · Meridian Labs",
    cls: "text-sm font-semibold",
    spec: "text-sm · 14px / 600",
    role: "Table row primary",
  },
  {
    sample: "Updated 12 minutes ago · 3 of 24 tickets",
    cls: "text-xs text-muted-foreground",
    spec: "text-xs · 12px / 400",
    role: "Meta & caption",
  },
  {
    sample: "Settings",
    cls: "text-xs font-bold uppercase tracking-widest text-slate-400",
    spec: "text-xs · 700 / tracking-widest",
    role: "Eyebrow · nav group",
  },
  {
    sample: "#4821   $1,740.00   103.21.44.9   sk_live_····8f2a",
    cls: "font-mono text-sm text-secondary-foreground",
    spec: "font-mono · text-xs → text-sm",
    role: "IDs & metrics",
  },
] as const;

/* ------------------------------------------------------------- space + radius */

export const SPACE_SCALE = [
  { w: "w-1", label: "gap-1 · 4", use: "icon-to-label, dot gaps" },
  { w: "w-2", label: "gap-2 · 8", use: "chip rows, button clusters" },
  { w: "w-2.5", label: "gap-2.5 · 10", use: "table cell gap" },
  { w: "w-3", label: "gap-3 · 12", use: "stacked fields" },
  { w: "w-4", label: "gap-4 · 16", use: "card padding, mobile page pad" },
  { w: "w-5", label: "gap-5 · 20", use: "section gap" },
  { w: "w-6", label: "p-6 · 24", use: "desktop page padding" },
  { w: "w-8", label: "p-8 · 32", use: "ultra-wide page padding" },
  { w: "w-12", label: "p-12 · 48", use: "ultra-wide, ≥1800px" },
] as const;

export const RADIUS_SCALE = [
  { cls: "rounded-sm", label: "rounded-sm · 6", use: "input, badge" },
  { cls: "rounded-md", label: "rounded-md · 8", use: "nav item, tile" },
  { cls: "rounded-lg", label: "rounded-lg · 10", use: "button, bubble" },
  { cls: "rounded-xl", label: "rounded-xl · 14", use: "panel, table" },
  { cls: "rounded-2xl", label: "rounded-2xl · 16", use: "plan card" },
  { cls: "rounded-full", label: "rounded-full", use: "pill, switch" },
] as const;

/* ---------------------------------------------------------- elevation + motion */

export const ELEVATION_ROWS = [
  {
    cls: "shadow-xs bg-card border border-border",
    label: "Rest",
    value: "0 1px 2px 0 rgb(0 0 0 / .05)",
  },
  {
    cls: "shadow-sm bg-primary",
    label: "Control",
    value: "0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)",
  },
  {
    cls: "shadow-lg bg-card border border-border",
    label: "Overlay · popover, menu",
    value: "0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)",
  },
  {
    cls: "shadow-xl bg-card border border-border",
    label: "Sheet · modal",
    value: "0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1)",
  },
  {
    cls: "bg-card border-2 border-ring ring-[3px] ring-ring/30",
    label: "Focus ring",
    value: "ring-[3px] ring-ring/30 + border-ring",
  },
] as const;

export const MOTION_ROWS = [
  {
    key: "duration-200",
    body: "Background, border, colour — duration-200 ease-out, Tailwind's own steps",
  },
  { key: "Radix default", body: "Mobile nav sheet slide — Radix's own transition, ease-out" },
  { key: "scale .98", body: "Press feedback on every action. No bounce, ever." },
  { key: "1.3s loop", body: "Skeleton pulse, opacity .45 → 1 → .45" },
  { key: "550ms", body: "Loading flash on route change, so the skeleton reads" },
  { key: "3200ms", body: "Toast lifetime before auto-dismiss" },
] as const;

/* ----------------------------------------------------------------- breakpoints */

export const BREAKPOINT_ROWS = [
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
  {
    name: "xl:",
    width: "≥ 1280",
    behaviour: "All six fixed queue tracks fit — select, ID, subject, priority, assignee, SLA",
  },
  {
    name: "2xl:",
    width: "≥ 1536",
    behaviour: "Reports go three-up; room for the picker's optional columns without scrolling",
  },
  {
    name: "wide:",
    width: "≥ 1800",
    behaviour: "288px sidebar, p-8/p-12, content capped at max-w-[2040px] — the one added step",
  },
] as const;

/* --------------------------------------------------------------- code snippets */

export const CODE = {
  tokens: `/* app/globals.css — every value is a stock Tailwind primitive. */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.625rem;                 /* shadcn default — sm/md/lg/xl derive */
  --background: var(--color-slate-50);   --foreground: var(--color-slate-900);
  --card: #fff;                          --card-foreground: var(--color-slate-900);
  --popover: #fff;                       --popover-foreground: var(--color-slate-900);
  --primary: var(--color-green-800);      --primary-foreground: #fff;
  --secondary: var(--color-slate-100);   --secondary-foreground: var(--color-slate-700);
  --muted: var(--color-slate-100);       --muted-foreground: var(--color-slate-500);
  --accent: #e7f1f1;                       --accent-foreground: var(--color-teal-700);
  --destructive: var(--color-red-600);
  --border: var(--color-slate-200);      --input: var(--color-slate-300);
  --ring: var(--color-green-600);
  --chart-1: var(--color-green-800);   --chart-2: var(--color-green-600);
  --chart-3: var(--color-slate-500);  --chart-4: var(--color-indigo-600);
  --chart-5: var(--color-amber-600);
  --sidebar: #fff;                       --sidebar-foreground: var(--color-slate-700);
  --sidebar-primary: var(--color-green-800);  --sidebar-primary-foreground: #fff;
  --sidebar-accent: #e7f1f1;                   --sidebar-accent-foreground: var(--color-teal-700);
  --sidebar-border: var(--color-slate-100);  --sidebar-ring: var(--color-green-600);
}

/* Additions only — nothing above is redefined. */
@theme inline {
  --color-success: #12A150;
  --color-success-soft: #E4F6EC;
  --color-success-strong: #0B7A3B;
  --color-warning: var(--color-amber-600);
  --color-warning-soft: var(--color-amber-50);
  --color-warning-strong: var(--color-amber-700);
  --color-info: var(--color-indigo-600);
  --color-info-soft: var(--color-indigo-50);
  --color-info-strong: var(--color-indigo-800);
  --color-destructive-soft: var(--color-red-50);
  --color-destructive-strong: var(--color-red-700);
  --color-note: var(--color-amber-100);
  --color-note-border: var(--color-amber-200);
  --color-note-foreground: var(--color-amber-800);
  --color-chart-muted: var(--color-slate-300);
  --breakpoint-wide: 1800px;          /* extra step; sm…2xl untouched */
}`,
  type: `// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";
const inter = Inter({ subsets:["latin"], variable:"--font-inter", display:"swap" });
const mono  = JetBrains_Mono({ subsets:["latin"], variable:"--font-jetbrains-mono" });

// usage — named Tailwind steps only, no arbitrary px
<h1 className="text-2xl font-bold tracking-tight">Ticket queue</h1>
<span className="font-mono text-xs tabular-nums text-muted-foreground">#4821</span>
<span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Settings</span>`,
  buttons: `// components/ui/button.tsx — stock shadcn variants, tokens only
default:     "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-green-900"
secondary:   "border border-input bg-card shadow-xs hover:bg-secondary"
ghost:       "text-secondary-foreground hover:bg-secondary"
destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90"
focus:       "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]"
sizes:  sm "h-11 md:h-8 px-3" · default "h-11 md:h-10 px-4" · lg "h-12 px-6"

<Button>New ticket</Button>
<Button variant="secondary" size="sm">Import from CSV</Button>
<Button loading>Signing in</Button>
<Button variant="destructive">Delete workspace</Button>`,
  badges: `// lib/badge-tones.ts — single source for every pill in the app
export const statusTone = { New:"neutral", Open:"info", Pending:"warning", Solved:"success" };
export const priorityTone = { Urgent:"error", High:"warning", Normal:"info", Low:"neutral" };

<Badge tone={statusTone[t.status]} dot>{t.status}</Badge>
<Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>

// tone → classes (soft surface + strong text + 25% inset ring)
success: "bg-success-soft text-success-strong ring-success/25"`,
} as const;

/* ------------------------------------------------------------- reference tables */
/* All eight D7 tables, transcribed verbatim from the page's own `renderVals()`. */

export const ROLE_ROWS = [
  {
    role: "Tenant Admin",
    sees: "Everything — queue, customers, all settings, billing, audit log",
    denied: "Nothing. Only role that can delete the workspace or change the plan.",
  },
  {
    role: "Manager",
    sees: "Queue, customers, KB, macros, reports, SLA policies, team",
    denied: "Billing, security, data export, audit log",
  },
  {
    role: "Agent",
    sees: "Queue, own tickets, customers, KB, macros, notifications",
    denied: "All of Settings, reports, billing — the nav group is hidden, not disabled",
  },
  {
    role: "Customer",
    sees: "Portal only — own tickets, new request, help centre",
    denied: "Every agent surface. A wrong-role URL lands on the portal, never a 403.",
  },
] as const;

export const A11Y_ROWS = [
  { pair: "text-primary on card", val: "slate-900 on white", ratio: "17.9:1", verdict: "pass AAA" },
  {
    pair: "text-secondary on card",
    val: "slate-600 on white",
    ratio: "7.6:1",
    verdict: "pass AAA",
  },
  {
    pair: "text-muted on card",
    val: "slate-500 on white",
    ratio: "4.8:1",
    verdict: "pass AA — text-xs is the floor",
  },
  {
    pair: "text-muted on canvas",
    val: "slate-500 on slate-50",
    ratio: "4.5:1",
    verdict: "pass AA, at the limit — don't darken the canvas",
  },
  {
    pair: "primary button label",
    val: "white on green-800",
    ratio: "7.1:1",
    verdict: "pass AAA at 18px+",
  },
  { pair: "link on card", val: "green-800 on white", ratio: "7.1:1", verdict: "pass AAA at 18px+" },
  {
    pair: "selected nav / tab ink",
    val: "teal-700 on #E7F1F1",
    ratio: "4.8:1",
    verdict: "pass AA",
  },
  { pair: "info pill", val: "indigo-800 on indigo-50", ratio: "8.9:1", verdict: "pass AAA" },
  { pair: "success pill", val: "#0B7A3B on #E4F6EC", ratio: "4.8:1", verdict: "pass AA" },
  {
    pair: "warning pill",
    val: "amber-700 on amber-50",
    ratio: "4.8:1",
    verdict: "pass AA, at the limit",
  },
  { pair: "destructive pill", val: "red-700 on red-50", ratio: "5.9:1", verdict: "pass AA" },
  { pair: "internal note", val: "amber-800 on amber-100", ratio: "6.4:1", verdict: "pass AA" },
  {
    pair: "focus border (indicator)",
    val: "green-600 on white",
    ratio: "3.3:1",
    verdict: "pass SC 1.4.11 — carries the focus contrast",
  },
  {
    pair: "focus ring halo",
    val: "green-600 30% on white",
    ratio: "1.4:1",
    verdict: "secondary cue only — the border above carries it",
  },
  {
    pair: "caption on card",
    val: "slate-400 on white",
    ratio: "2.6:1",
    verdict: "fails — decorative only, never for meaning",
  },
  {
    pair: "disabled control",
    val: "slate-400 on slate-100",
    ratio: "2.3:1",
    verdict: "exempt (disabled), but pair with a hint",
  },
] as const;

export const FMT_ROWS = [
  { what: "Ticket ID", rule: "#4821 — mono, hash prefix, never zero-padded" },
  {
    what: "Relative time",
    rule: "Under 7 days: “12 minutes ago”. Older: “14 Jul 2026”. Never both.",
  },
  { what: "Absolute time", rule: "22 Jul 2026, 14:30 IST — always name the zone" },
  {
    what: "SLA countdown",
    rule: "4h 20m left · 1h 12m left · Breached 26m. Drops to minutes under 1h.",
  },
  { what: "Duration metric", rule: "27m, 3h 40m, 2d 4h — no decimals, no “hrs”" },
  { what: "Currency", rule: "$1,740.00 — mono, symbol prefix, two decimals on invoices only" },
  { what: "Counts", rule: "24 tickets · 1 ticket. Zero is “No tickets”, never “0 tickets”." },
  { what: "Percentages", rule: "94% — integer. One decimal only for CSAT (4.6)." },
  { what: "Names", rule: "Priya Raman · Meridian Labs — person first, org after a middot" },
  { what: "Secrets", rule: "sk_live_····8f2a — first 8 and last 4, middots between" },
] as const;

export const API_ROWS = [
  {
    c: "Button",
    p: "variant primary|secondary|ghost|danger · size sm|md|lg · loading · disabled · asChild",
    n: "shadcn: variant default|secondary|ghost|destructive",
  },
  {
    c: "IconButton",
    p: "label (required, becomes aria-label + tooltip) · size · variant",
    n: "Never ship without label",
  },
  {
    c: "Badge",
    p: "tone neutral|brand|info|success|warning|error · dot · size sm|md",
    n: "tone, not variant — the choice is semantic",
  },
  { c: "Tag", p: "selected · removable · onRemove · onClick", n: "Interactive; Badge is not" },
  {
    c: "Input",
    p: "label · hint · error · prefix · invalid · disabled · type",
    n: "error replaces hint, never stacks",
  },
  {
    c: "Select",
    p: "label · hint · error · children (option)",
    n: "Native select, styled to match Input",
  },
  {
    c: "Checkbox",
    p: "label · defaultChecked · indeterminate · disabled",
    n: "indeterminate for table header only",
  },
  {
    c: "Switch",
    p: "defaultChecked · disabled · onChange",
    n: "Instant-apply settings only; never inside a form with Save",
  },
  { c: "Card", p: "interactive (hover lift) · children", n: "12px radius; 16px for plan cards" },
  {
    c: "PageHeader",
    p: "title · subtitle · actions · breadcrumb",
    n: "One per screen, above all content",
  },
  {
    c: "StateCard",
    p: "icon · title · body · action · tone",
    n: "Covers empty and error with one API",
  },
] as const;

export const CUSTOM_ROWS = [
  {
    v: "--success · -soft · -strong",
    tw: "green-600 · 50 · 800",
    why: "shadcn ships --destructive but no positive tone. Solved tickets, met SLAs, verified domains, paid invoices. Shares the brand's green ramp on purpose — a second green would be indistinguishable.",
  },
  {
    v: "--warning · -soft · -strong",
    tw: "amber-600 · 50 · 700",
    why: "No shadcn equivalent. SLA at risk, unverified channel, past-due invoice — states that need attention but aren't failures.",
  },
  {
    v: "--info · -soft · -strong",
    tw: "indigo-600 · 50 · 800",
    why: "No shadcn equivalent. Deliberately NOT brand-derived: when info shared the brand hue, an informational pill and an active-state pill were identical.",
  },
  {
    v: "--destructive-soft · -strong",
    tw: "red-50 · 700",
    why: "shadcn's --destructive is a single solid. Error pills and alert banners need the soft surface and the strong text to pair with it.",
  },
  {
    v: "--note · -border · -foreground",
    tw: "amber-100 · 200 · 800",
    why: "The internal-note surface. A distinct amber from --warning-soft so “only your team sees this” never reads as a warning.",
  },
  {
    v: "--brand-soft · --brand-ink",
    tw: "#E7F1F1 · teal-700",
    why: "Selected-state surface and ink — nav items, tabs, chips, pagination, checked menu rows. Reference-exact like --success; green-100 stays badge-only so a selected control never reads as a brand badge.",
  },
  {
    v: "--chart-muted",
    tw: "slate-300",
    why: "Out-of-hours bars in Reports. Context, not a sixth series — so it sits outside --chart-1…5.",
  },
  {
    v: "Interloid bundle bridge — 33 names",
    tw: "→ the contract above",
    why: "The design system's component library paints from its own variable names. Each is aliased to a contract token (--blue-base → --primary, --error → --destructive, --border-subtle → --border) or to the slate ramp, so Button, Badge, Tag, Input and Switch render in this system instead of falling back to stock Interloid blue. Bridge only — it introduces no new value.",
  },
] as const;

export const DUP_ROWS = [
  {
    a: "--primary  vs  --success-strong",
    v: "green-800  ·  distinct green",
    verdict: "different",
    note: "No longer shared: --success now matches the reference design's exact values (#12A150/#E4F6EC/#0B7A3B) rather than reusing the primary ramp. Two greens 20° apart are indistinguishable at 12px, so the system carries one green and disambiguates status by mapping — New is neutral, Open is indigo, green means Solved.",
  },
  {
    a: "--primary  vs  --chart-1",
    v: "green-800  ·  green-800",
    verdict: "same",
    note: "Intentional: the primary chart series IS the brand. Nothing else in a chart is green except chart-2.",
  },
  {
    a: "--chart-2  vs  --success",
    v: "green-600  ·  #12A150",
    verdict: "different",
    note: "No longer duplicated — --success now uses the reference design's own green. chart-2 is the previous-period series; --success only ever appears on a pill or a dot.",
  },
  {
    a: "--chart-4  was  green-600",
    v: "→ indigo-600",
    verdict: "fixed",
    note: "Was a third green in a five-series palette next to chart-1 and chart-2. Reassigned to indigo-600, so no two chart series share a hue family.",
  },
  {
    a: "--accent  vs  --success-soft",
    v: "#E7F1F1  ·  #E4F6EC",
    verdict: "close",
    note: "Near-identical pale tints, but never adjacent: --accent fills nav items and tabs, --success-soft fills pills. Both pair with green-900 / green-800 text well above AA.",
  },
  {
    a: "--note  vs  --warning-soft",
    v: "amber-100  ·  amber-50",
    verdict: "distinct",
    note: "Deliberately one step apart so an internal note reads as a note, not a warning. The note also carries a border (amber-200) that warning-soft does not.",
  },
  {
    a: "--info  vs  --primary",
    v: "indigo-600  ·  green-800",
    verdict: "distinct",
    note: "The original collision, fixed earlier: info was brand-derived and identical to the active state.",
  },
  {
    a: "--secondary  vs  --muted",
    v: "slate-100  ·  slate-100",
    verdict: "same",
    note: "shadcn's own default — both are slate-100 in stock shadcn too. Their foregrounds differ (slate-700 vs slate-500), which is what carries the distinction.",
  },
  {
    a: "--destructive-strong  vs  --destructive",
    v: "red-700  ·  red-600",
    verdict: "distinct",
    note: "Solid fills use red-600; pill text uses red-700 on red-50 for 5.9:1.",
  },
] as const;

/* --------------------------------------------------------------- icon catalogue */
/* The page ships raw `d` attributes; D10 resolves to lucide components, so only the
   names travel. All 22 names below are real lucide exports — verified at build. */
export const ICON_NAMES = [
  "Ticket",
  "Clock",
  "Users",
  "ChartColumn",
  "Bell",
  "Search",
  "Plus",
  "Check",
  "TriangleAlert",
  "Inbox",
  "CreditCard",
  "FileText",
  "Filter",
  "Lock",
  "Shield",
  "Mail",
  "Database",
  "BookOpen",
  "Zap",
  "Upload",
  "Building2",
  "MessageSquare",
] as const;

/* ----------------------------------------------------- remaining code snippets */

export const CODE2 = {
  forms: `<Field label="Portal address" hint="northwind.servicedesk.pro" htmlFor="slug">
  <Input id="slug" defaultValue="northwind" />
</Field>

<Field label="Password" error="That email and password don't match.">
  <Input type="password" invalid />
</Field>

// Input: h-11 md:h-10 rounded-sm border-input
//        focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]
//        aria-invalid:border-destructive`,
  alerts: `<Alert className="border-destructive/25 bg-destructive-soft text-destructive-strong">
  <TriangleAlert className="size-[18px]" />
  <AlertTitle>Last payment failed</AlertTitle>
  <AlertDescription>Card ending 4242 was declined on 22 Jul.</AlertDescription>
</Alert>

// swap the triple for other tones: warning-soft/warning-strong,
// success-soft/success-strong, info-soft/info-strong
// all four are @theme additions — see the Custom variables section`,
  skeletons: `// components/state-card.tsx — queue loading state
<div className="overflow-hidden rounded-xl border bg-card">
  {Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="flex h-12 items-center gap-3 border-t px-4 animate-pulse">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-2 w-12" />
      <Skeleton className="h-2 flex-1" />
      <Skeleton className="h-4 w-16 rounded-full" />
    </div>
  ))}
</div>`,
  toast: `// Toasts — sonner, themed to the inverse surface
<Toaster position="bottom-center" toastOptions={{
  className: "bg-foreground text-background rounded-lg text-sm font-semibold"
}} />
toast("Priority set to High on 3 tickets");

// components/state-card.tsx handles empty + error with one API
<StateCard icon={Inbox} title="Queue clear" body="Nothing matches this view."
  action={<Button>New ticket</Button>} />`,
  install: `npx create-next-app@latest servicedesk-pro --ts --app --tailwind --eslint
cd servicedesk-pro
npx shadcn@latest init                       # CSS variables: yes
npx shadcn@latest add sidebar button input select checkbox switch textarea label \\
  badge card table tabs dropdown-menu dialog sheet popover avatar progress \\
  separator skeleton tooltip pagination alert sonner
npm i lucide-react next-themes

# then copy react/ over the generated app and rename the route groups:
#   app/-app-/  →  app/(app)/     app/-auth-/  →  app/(auth)/
#   app/-portal-/  →  app/(portal)/`,
} as const;

/** Macro placeholder — the page keeps this out of its template for the same reason. */
export const MACRO_PLACEHOLDER =
  "Hi {{first_name}} — thanks for flagging this. I've refunded the duplicate charge…";

/** View tabs and pagination, rendered from the page's own `renderVals()` state. */
export const VIEW_TABS = [
  { id: "all", label: "All open", n: 24 },
  { id: "mine", label: "My tickets", n: 7 },
  { id: "unassigned", label: "Unassigned", n: 3 },
  { id: "breach", label: "Breaching", n: 2 },
  { id: "solved", label: "Solved", n: 12 },
] as const;

export const PAGE_SIZES = [8, 15, 25, 50] as const;
