# Token extraction — `Design System.dc.html`

> Verbatim custom-property census. **No interpretation, no mapping.** Every value below is
> transcribed from a declaration that actually exists in the project; the mapping decisions
> live in `docs/treatments.md` and the deviations table.

## Source of truth and read order

| #   | File                                                                                                                   | Role                                               | Read                   |
| --- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| 1   | `_ds/interloid-design-system-v1-87a1e8a8…/tokens/{fonts,colors,typography,spacing,elevation}.css`                      | Interloid bundle, linked first in `<helmet>`       | full                   |
| 2   | `Design System.dc.html` `<style>` → `:root`                                                                            | The page's **own** override layer — authoritative  | full (lines 19–75)     |
| 3   | `Design System.dc.html` markup                                                                                         | 2343 lines of inline style — treatments            | full                   |
| 4   | `Design System.dc.html` `<script type="text/x-dc">` → `code.tokens`, `shadcnRows`, `customRows`, `a11yRows`, `dupRows` | The page's documented intent                       | full (lines 1996–2343) |
| 5   | `react/app/globals.css`                                                                                                | The React port the page says it is "built against" | full                   |

Because 1 is linked _before_ 2, the page's `:root` **overrides** most bundle names. §5 lists the
bundle names that survive the cascade — they are live in the rendered page and therefore part of
the design, even though the page never restates them.

The design system page declares **zero dark-theme rules**. §7 states where dark comes from.

---

## 1. shadcn contract — `Design System.dc.html` `:root`, verbatim

Transcribed exactly as written, including the page's own inline comments.

```css
--radius: 0.625rem;
--background: #f8fafc;
--foreground: #0f172a; /* slate-50 / slate-900 */
--card: #ffffff;
--card-foreground: #0f172a;
--popover: #ffffff;
--popover-foreground: #0f172a;
--primary: #166534;
--primary-foreground: #ffffff; /* green-800 */
--secondary: #f1f5f9;
--secondary-foreground: #334155; /* slate-100 / slate-700 */
--muted: #f1f5f9;
--muted-foreground: #64748b; /* slate-100 / slate-500 */
--accent: #dcfce7;
--accent-foreground: #166534; /* green-100 / green-800 */
--destructive: #dc2626; /* red-600 */
--border: #e2e8f0;
--input: #cbd5e1;
--ring: #16a34a; /* slate-200 / slate-300 / green-600 */
--chart-1: #166534;
--chart-2: #16a34a;
--chart-3: #64748b;
--chart-4: #4f46e5;
--chart-5: #d97706;
--sidebar: #ffffff;
--sidebar-foreground: #334155;
--sidebar-primary: #166534;
--sidebar-primary-foreground: #ffffff;
--sidebar-accent: #dcfce7;
--sidebar-accent-foreground: #166534;
--sidebar-border: #f1f5f9;
--sidebar-ring: #16a34a;
```

Eighteen names. Every one is a name the starter already has. No renaming required.

**Per-token role, from the page's own `shadcnRows` table** (verbatim `use` column):

| Token                               | Value                                             | Used by (page's words)                                                                       |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--background` / `--foreground`     | `#F8FAFC` / `#0F172A`                             | App canvas and default text. The frame behind every screen.                                  |
| `--card` / `-foreground`            | `#FFFFFF` / `#0F172A`                             | Every panel, table shell, stat tile, settings card, auth card.                               |
| `--popover` / `-foreground`         | `#FFFFFF` / `#0F172A`                             | Notification tray, avatar menu, column picker, global search.                                |
| `--primary` / `-foreground`         | `#166534` / `#FFFFFF`                             | Primary button, selected row, links. The one action colour; focus uses the lighter `--ring`. |
| `--secondary` / `-foreground`       | `#F1F5F9` / `#334155`                             | Secondary button hover, filter-bar chips, table header band.                                 |
| `--muted` / `-foreground`           | `#F1F5F9` / `#64748B`                             | Hints, timestamps, placeholders, empty-state body, disabled copy.                            |
| `--accent` / `-foreground`          | `#DCFCE7` / `#166534`                             | Active nav item, active tab, selected chip, brand pill surface.                              |
| `--destructive`                     | `#DC2626`                                         | Delete and revoke actions, breach badges, failed invoices, field errors.                     |
| `--border`                          | `#E2E8F0`                                         | Card and table borders. Inner row separators drop to slate-100.                              |
| `--input`                           | `#CBD5E1`                                         | Input, select, textarea and row-checkbox borders at rest.                                    |
| `--ring`                            | `#16A34A`                                         | `focus-visible:ring-[3px] ring-ring/30` + `border-ring` — shadcn's own pattern.              |
| `--radius`                          | `0.625rem`                                        | shadcn base. Derives sm 6 · md 8 · lg 10 · xl 14 — never restate them.                       |
| `--chart-1…5`                       | `#166534 · #16A34A · #64748B · #4F46E5 · #D97706` | Volume, comparison, benchmark, category, at risk. Never rainbow.                             |
| `--sidebar` / `-foreground`         | `#FFFFFF` / `#334155`                             | Sidebar surface and idle item labels, expanded or railed.                                    |
| `--sidebar-primary` / `-foreground` | `#166534` / `#FFFFFF`                             | Org avatar tile, count pills, sidebar CTA.                                                   |
| `--sidebar-accent` / `-foreground`  | `#DCFCE7` / `#166534`                             | Active **and hovered** nav item — fill plus ink, no left border.                             |
| `--sidebar-border`                  | `#F1F5F9`                                         | Sidebar header and footer dividers, group separators.                                        |
| `--sidebar-ring`                    | `#16A34A`                                         | Focus ring on rail buttons and the collapse toggle.                                          |

---

## 2. Semantic additions — `Design System.dc.html` `:root`, verbatim

```css
--success: #12a150;
--success-soft: #e4f6ec;
--success-strong: #0b7a3b; /* distinct green, matches the reference design exactly */
--warning: #d97706;
--warning-soft: #fffbeb;
--warning-strong: #b45309; /* amber-600/50/700 */
--info: #4f46e5;
--info-soft: #eef2ff;
--info-strong: #3730a3; /* indigo-600/50/800 */
--destructive-soft: #fef2f2;
--destructive-strong: #b91c1c; /* red-50/700 */
--note: #fef3c7;
--note-border: #fde68a;
--note-foreground: #92400e; /* amber-100/200/800 */
```

`--chart-muted` is named in the `customRows` table and in the Charts section prose
(`--chart-muted (slate-300)`) and rendered as `#CBD5E1`, but is **never declared in `:root`**.
The React port declares it: `--chart-muted: var(--color-slate-300)`.

**Why each exists — `customRows`, verbatim:**

| Added variable                   | Resolves to           | Why it exists                                                                                                                                                                                       |
| -------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--success · -soft · -strong`    | green-600 · 50 · 800  | shadcn ships `--destructive` but no positive tone. Solved tickets, met SLAs, verified domains, paid invoices. Shares the brand's green ramp on purpose — a second green would be indistinguishable. |
| `--warning · -soft · -strong`    | amber-600 · 50 · 700  | No shadcn equivalent. SLA at risk, unverified channel, past-due invoice — states that need attention but aren't failures.                                                                           |
| `--info · -soft · -strong`       | indigo-600 · 50 · 800 | No shadcn equivalent. Deliberately NOT brand-derived: when info shared the brand hue, an informational pill and an active-state pill were identical.                                                |
| `--destructive-soft · -strong`   | red-50 · 700          | shadcn's `--destructive` is a single solid. Error pills and alert banners need the soft surface and the strong text to pair with it.                                                                |
| `--note · -border · -foreground` | amber-100 · 200 · 800 | The internal-note surface. A distinct amber from `--warning-soft` so "only your team sees this" never reads as a warning.                                                                           |
| `--chart-muted`                  | slate-300             | Out-of-hours bars in Reports. Context, not a sixth series — so it sits outside `--chart-1…5`.                                                                                                       |

> ⚠ **The "Resolves to" column disagrees with the declared value for `--success`.** The table says
> `green-600 · 50 · 800` (= `#16A34A / #F0FDF4 / #166534`); `:root` declares
> `#12A150 / #E4F6EC / #0B7A3B` with the comment _"matches the reference design exactly."_ The
> `dupRows` audit sides with the literals twice (_"`--success` now matches the reference design's
> exact values (#12A150/#E4F6EC/#0B7A3B) rather than reusing the primary ramp"_), and the a11y
> table computes its ratio from the literals (`#0B7A3B on #E4F6EC — 4.8:1`). This is
> `DESIGN_SUMMARY.md` ambiguity #4. **The literals win** (declared value > prose label), and this
> is a flagged row in the deviations table.

---

## 3. Breakpoint, type and elevation additions

```css
--breakpoint-wide: 1800px; /* @theme, from code.tokens — "extra step; sm…2xl untouched" */
```

The page adds **nothing else** to the type or elevation scale, and says so explicitly:

- _"No radius overrides — only `--radius: 0.625rem` carries a value. `rounded-sm/md/lg/xl` derive
  from it exactly as shadcn intends… `rounded-2xl` and `rounded-full` stay Tailwind's."_
- _"No type-scale overrides — sizes are `text-xs` → `text-4xl` only. `text-xs` (12px) is the floor."_
- _"Shadows are Tailwind's — `shadow-xs` at rest, `shadow-sm` on controls, `shadow-lg` on overlays,
  `shadow-xl` on dialogs and sheets. The slate-tinted custom set is retired."_

Verified against the Elevation specimen — the four swatches are byte-identical to Tailwind's
`shadow-xs / sm / lg / xl`:

| Role                    | Declared box-shadow                                                 | Tailwind                                  |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| Rest                    | `0 1px 2px 0 rgb(0 0 0 / .05)`                                      | `shadow-xs` ✅ exact                      |
| Control                 | `0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)`       | `shadow-sm` ✅ exact                      |
| Overlay · popover, menu | `0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)`  | `shadow-lg` ✅ exact                      |
| Sheet · modal           | `0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1)` | `shadow-xl` ✅ exact                      |
| Focus ring              | `border 2px #16A34A` + `0 0 0 3px rgb(22 163 74 / .3)`              | `border-ring` + `ring-[3px] ring-ring/30` |

**Radius ladder**, from the Radius-scale specimen (each swatch's literal `border-radius`):

| Step           | Declared | `calc()` in the page's bridge  | Use            |
| -------------- | -------- | ------------------------------ | -------------- |
| `rounded-sm`   | `6px`    | `calc(var(--radius) - 4px)`    | input, badge   |
| `rounded-md`   | `8px`    | `calc(var(--radius) - 2px)`    | nav item, tile |
| `rounded-lg`   | `10px`   | `var(--radius)`                | button, bubble |
| `rounded-xl`   | `14px`   | `calc(var(--radius) + 4px)`    | panel, table   |
| `rounded-2xl`  | `16px`   | — _(page: "stays Tailwind's")_ | plan card      |
| `rounded-full` | `999px`  | `--radius-full:999px`          | pill, switch   |
| circle         | `50%`    | —                              | avatar, dot    |

**Type steps**, from the Typography specimen (each row's literal inline style):

| Step        | size / weight / tracking / line-height | Role                            |
| ----------- | -------------------------------------- | ------------------------------- |
| `text-2xl`  | 24px / 700 / `-0.025em` / 1.2          | Page title                      |
| `text-xl`   | 20px / 700 / `-0.025em` / 1.3          | Record title                    |
| `text-lg`   | 18px / 600 / — / —                     | Section heading                 |
| `text-base` | 16px / 600 / — / —                     | Card title                      |
| `text-sm`   | 14px / 400 / — / 1.6                   | Body                            |
| `text-sm`   | 14px / 600 / — / —                     | Table row primary               |
| `text-xs`   | 12px / 400 / — / —                     | Meta & caption                  |
| `text-xs`   | 12px / 700 / `0.1em` / —               | Eyebrow · nav group (uppercase) |
| `font-mono` | `text-xs` → `text-sm`                  | IDs & metrics                   |
| —           | 30px / 700 / `-0.025em` mono           | Plan-card price                 |
| —           | 36px / 700 / `-0.025em` / 1.15         | Page `<h1>` (doc chrome only)   |

> ⚠ The Typography _prose_ says headings carry `-0.02em`; every heading in the markup declares
> `-0.025em` (Tailwind `tracking-tight`). The bundle's `--tracking-tight` is `-0.02em`. **Markup
> wins: `-0.025em`.**

---

## 4. The page's documented `@theme` block — `code.tokens`, verbatim

This is the page's own recommendation, in its own notation. It is _documentation_, not the
rendered stylesheet; where it disagrees with §1–2 the rendered value wins.

```css
/* app/globals.css — every value is a stock Tailwind primitive. */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.625rem; /* shadcn default — sm/md/lg/xl derive */
  --background: var(--color-slate-50);
  --foreground: var(--color-slate-900);
  --card: #fff;
  --card-foreground: var(--color-slate-900);
  --popover: #fff;
  --popover-foreground: var(--color-slate-900);
  --primary: var(--color-green-800);
  --primary-foreground: #fff;
  --secondary: var(--color-slate-100);
  --secondary-foreground: var(--color-slate-700);
  --muted: var(--color-slate-100);
  --muted-foreground: var(--color-slate-500);
  --accent: var(--color-green-100);
  --accent-foreground: var(--color-green-800);
  --destructive: var(--color-red-600);
  --border: var(--color-slate-200);
  --input: var(--color-slate-300);
  --ring: var(--color-green-600);
  --chart-1: var(--color-green-800);
  --chart-2: var(--color-green-600);
  --chart-3: var(--color-slate-500);
  --chart-4: var(--color-indigo-600);
  --chart-5: var(--color-amber-600);
  --sidebar: #fff;
  --sidebar-foreground: var(--color-slate-700);
  --sidebar-primary: var(--color-green-800);
  --sidebar-primary-foreground: #fff;
  --sidebar-accent: var(--color-green-100);
  --sidebar-accent-foreground: var(--color-green-800);
  --sidebar-border: var(--color-slate-100);
  --sidebar-ring: var(--color-green-600);
}

/* Additions only — nothing above is redefined. */
@theme inline {
  --color-success: #12a150;
  --color-success-soft: #e4f6ec;
  --color-success-strong: #0b7a3b;
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
  --breakpoint-wide: 1800px; /* extra step; sm…2xl untouched */
}
```

Note: even the page's own snippet keeps `--success` / `-soft` / `-strong` as **literal hexes**,
not `var(--color-green-*)` — a third confirmation that the literals are authoritative for that
triple.

---

## 5. Bundle values that survive the cascade

Declared by the linked `_ds/…/tokens/*.css`, **not** overridden by the page's `:root`, therefore
live in the rendered page. These are the design's values too.

### `typography.css` — nothing here is overridden except `--tracking-caps`

```css
--font-display: "Inter", "Segoe UI", system-ui, sans-serif;
--font-body: "Inter", "Segoe UI", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", monospace;

--text-h1: 3rem;
--text-h2: 2.25rem;
--text-h3: 1.75rem;
--text-h4: 1.375rem;
--text-h5: 1.125rem;
--text-h6: 1rem;
--text-body: 1rem;

--leading-h1: 1.1;
--leading-h2: 1.15;
--leading-h3: 1.2;
--leading-h4: 1.3;
--leading-h5: 1.4;
--leading-h6: 1.4;
--leading-body: 1.6;
--leading-small: 1.5;
--leading-caption: 1.4;

--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.04em;
```

**`--font-mono` is the one load-bearing survivor.** The page never redeclares it, and uses
`var(--font-mono)` on every ticket ID, currency figure, IP, secret, axis label, timestamp,
count pill, keycap and `<pre>`. It is a real design value with no starter equivalent.

### `colors.css`

```css
--cyan-base: #11ccee;
--cyan-glow: #4ef2fb;
--cyan-deep: #0790e5; /* unused in ServiceDesk */
--text-brand: var(--blue-base); /* → #166534 after the page's override */
--text-link: var(--blue-base); /* → #166534 */
--text-link-hover: var(--blue-pressed); /* → #14532D  ← green-900 */
--surface-sunken: var(--neutral-100); /* → #F1F5F9 */
--border-focus: var(--blue-base); /* → #166534, ≠ --ring #16A34A */
```

`--text-link-hover → #14532D` corroborates the Brand swatch caption _"Pressed · link hover ·
#14532D · green-900"_, against the page's own flat rule `a:hover{color:#166534}`.

### `spacing.css` / `elevation.css`

```css
--space-0: 0;
--space-7: 3rem;
--space-8: 4rem;
--space-9: 6rem;
--gradient-hero: linear-gradient(
  135deg,
  #0f33d7 0%,
  #1852ff 45%,
  #11ccee 100%
); /* Interloid blue */
--gradient-progress: linear-gradient(
  90deg,
  #1852ff 0%,
  #0790e5 55%,
  #4ef2fb 100%
); /* Interloid blue */
```

Both gradients are stock-Interloid blue and appear nowhere in ServiceDesk. Not ported.

### `fonts.css`

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap");
```

⚠ CDN. The starter's CSP is `font-src 'self'` — this import fails silently in the browser. Both
faces must be self-hosted via `next/font`. See deviations.

---

## 6. The Interloid bundle bridge — declared, deliberately **not** ported

The page's `:root` also declares 33 names that alias the bundle's own vocabulary onto the
contract. Recorded here for completeness; the rationale for excluding them is in the deviations
table.

```css
--blue-base: var(--primary);
--blue-hover: #15803d;
--blue-pressed: #14532d;
--error: var(--destructive);
--error-soft: var(--destructive-soft);
--error-strong: var(--destructive-strong);
--text-primary: var(--foreground);
--text-secondary: #475569;
--text-muted: var(--muted-foreground);
--text-inverse: #ffffff;
--bg-page: var(--background);
--surface-card: var(--card);
--surface-inverse: #0f172a;
--border-subtle: var(--border);
--border-default: var(--input);
--border-strong: #94a3b8;
--neutral-0: #ffffff;
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;
--neutral-950: #020617;
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
--radius-full: 999px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--text-small: 0.875rem;
--text-caption: 0.75rem;
--tracking-caps: 0.1em;
--shadow-low: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-medium: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-high: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--ring-focus: 0 0 0 3px rgb(22 163 74 / 0.3);
```

Three of these carry values the contract does **not** otherwise express, and they are needed:

| Bridge name        | Value                 | Not expressible via a contract token because…                   |
| ------------------ | --------------------- | --------------------------------------------------------------- |
| `--blue-hover`     | `#15803D` (green-700) | primary-button hover; contract only has `hover:bg-primary/90`   |
| `--blue-pressed`   | `#14532D` (green-900) | primary-button active + link hover                              |
| `--text-secondary` | `#475569` (slate-600) | body copy; sits between `--foreground` and `--muted-foreground` |

They are captured as treatments, not as tokens — see `treatments.md` §Buttons and §Typography.

---

## 7. Dark theme

**`Design System.dc.html` declares no dark rules at all.** Zero `.dark` selectors, zero
`prefers-color-scheme`, zero `[data-theme]`. `_ds/…/tokens/dark.css` exists but is **never
linked** by any of the three pages and covers only the bundle's own names, not the shadcn
contract.

The only dark declaration anywhere in the project is `react/app/globals.css`, the React port the
design-system page names as _"the reference the React export in `react/` is built against."_
Transcribed verbatim:

```css
.dark,
[data-theme="dark"] {
  --brand-hover: #16a34a;
  --brand-pressed: #166534;

  --background: var(--color-slate-950);
  --foreground: var(--color-slate-50);
  --card: var(--color-slate-900);
  --card-foreground: var(--color-slate-50);
  --popover: var(--color-slate-900);
  --popover-foreground: var(--color-slate-50);

  --primary-foreground: var(--color-slate-900);
  --secondary: var(--color-slate-800);
  --secondary-foreground: var(--color-slate-100);
  --muted: var(--color-slate-800);
  --muted-foreground: var(--color-slate-400);
  --accent: var(--color-slate-800);
  --accent-foreground: var(--color-slate-50);

  --border: oklch(1 0 0 / 8%);
  --input: oklch(1 0 0 / 16%);

  --sidebar: var(--color-slate-900);
  --sidebar-foreground: var(--color-slate-300);
  --sidebar-accent: var(--color-slate-800);
  --sidebar-accent-foreground: var(--color-slate-50);
  --sidebar-border: oklch(1 0 0 / 8%);

  --success-soft: var(--color-green-950);
  --success-strong: var(--color-green-400);
  --warning-soft: var(--color-amber-950);
  --warning-strong: var(--color-amber-400);
  --info-soft: var(--color-indigo-950);
  --info-strong: var(--color-indigo-300);
  --destructive-soft: var(--color-red-950);
  --destructive-strong: var(--color-red-400);
  --note: var(--color-amber-950);
  --note-border: var(--color-amber-800);
  --note-foreground: var(--color-amber-300);
}
```

### Dark override table

Every contract and addition token, and what dark does to it. **Nothing in this table is
design-declared** — the canonical page has no dark theme, so the "dark value" column is sourced
entirely from `react/app/globals.css`. Scored as `unscored` on the token board.

| Token                          | Light (design-declared)                                    | Dark                                                        | Source     |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| `--background`                 | `#F8FAFC`                                                  | `var(--color-slate-950)`                                    | react port |
| `--foreground`                 | `#0F172A`                                                  | `var(--color-slate-50)`                                     | react port |
| `--card`                       | `#FFFFFF`                                                  | `var(--color-slate-900)`                                    | react port |
| `--card-foreground`            | `#0F172A`                                                  | `var(--color-slate-50)`                                     | react port |
| `--popover`                    | `#FFFFFF`                                                  | `var(--color-slate-900)`                                    | react port |
| `--popover-foreground`         | `#0F172A`                                                  | `var(--color-slate-50)`                                     | react port |
| `--primary`                    | `#166534`                                                  | **inherited** — stays green-800                             | —          |
| `--primary-foreground`         | `#FFFFFF`                                                  | **`#FFFFFF` (override, see D-dark-1)**                      | ⚠ **ours** |
| `--secondary`                  | `#F1F5F9`                                                  | `var(--color-slate-800)`                                    | react port |
| `--secondary-foreground`       | `#334155`                                                  | `var(--color-slate-100)`                                    | react port |
| `--muted`                      | `#F1F5F9`                                                  | `var(--color-slate-800)`                                    | react port |
| `--muted-foreground`           | `#64748B`                                                  | `var(--color-slate-400)`                                    | react port |
| `--accent`                     | `#DCFCE7`                                                  | `var(--color-slate-800)` — **brand tint → neutral lift**    | react port |
| `--accent-foreground`          | `#166534`                                                  | `var(--color-slate-50)`                                     | react port |
| `--destructive`                | `#DC2626`                                                  | **inherited**                                               | —          |
| `--border`                     | `#E2E8F0`                                                  | `oklch(1 0 0 / 8%)`                                         | react port |
| `--input`                      | `#CBD5E1`                                                  | `oklch(1 0 0 / 16%)`                                        | react port |
| `--ring`                       | `#16A34A`                                                  | **inherited**                                               | —          |
| `--chart-1…5`                  | green-800 · green-600 · slate-500 · indigo-600 · amber-600 | **inherited**                                               | —          |
| `--chart-muted`                | `#CBD5E1`                                                  | **inherited**                                               | —          |
| `--sidebar`                    | `#FFFFFF`                                                  | `var(--color-slate-900)`                                    | react port |
| `--sidebar-foreground`         | `#334155`                                                  | `var(--color-slate-300)`                                    | react port |
| `--sidebar-primary`            | `#166534`                                                  | **inherited**                                               | —          |
| `--sidebar-primary-foreground` | `#FFFFFF`                                                  | **inherited**                                               | —          |
| `--sidebar-accent`             | `#DCFCE7`                                                  | `var(--color-slate-800)` — flips the same way as `--accent` | react port |
| `--sidebar-accent-foreground`  | `#166534`                                                  | `var(--color-slate-50)`                                     | react port |
| `--sidebar-border`             | `#F1F5F9`                                                  | `oklch(1 0 0 / 8%)`                                         | react port |
| `--sidebar-ring`               | `#16A34A`                                                  | **inherited**                                               | —          |
| `--success`                    | `#12A150`                                                  | **inherited**                                               | —          |
| `--success-soft`               | `#E4F6EC`                                                  | `var(--color-green-950)`                                    | react port |
| `--success-strong`             | `#0B7A3B`                                                  | `var(--color-green-400)`                                    | react port |
| `--warning`                    | `#D97706`                                                  | **inherited**                                               | —          |
| `--warning-soft`               | `#FFFBEB`                                                  | `var(--color-amber-950)`                                    | react port |
| `--warning-strong`             | `#B45309`                                                  | `var(--color-amber-400)`                                    | react port |
| `--info`                       | `#4F46E5`                                                  | **inherited**                                               | —          |
| `--info-soft`                  | `#EEF2FF`                                                  | `var(--color-indigo-950)`                                   | react port |
| `--info-strong`                | `#3730A3`                                                  | `var(--color-indigo-300)`                                   | react port |
| `--destructive-soft`           | `#FEF2F2`                                                  | `var(--color-red-950)`                                      | react port |
| `--destructive-strong`         | `#B91C1C`                                                  | `var(--color-red-400)`                                      | react port |
| `--note`                       | `#FEF3C7`                                                  | `var(--color-amber-950)`                                    | react port |
| `--note-border`                | `#FDE68A`                                                  | `var(--color-amber-800)`                                    | react port |
| `--note-foreground`            | `#92400E`                                                  | `var(--color-amber-300)`                                    | react port |
| `--destructive-foreground`     | `#FFFFFF`                                                  | **inherited**                                               | —          |
| `--info-foreground`            | `#FFFFFF`                                                  | **inherited**                                               | —          |
| `--success-foreground`         | `#0F172A`                                                  | **inherited**                                               | —          |
| `--warning-foreground`         | `#0F172A`                                                  | **inherited**                                               | —          |
| `--radius`                     | `0.625rem`                                                 | **inherited**                                               | —          |

**Two structural consequences of this table:**

1. **`--accent` stops being brand in dark.** Light: green-100 fill, green-800 ink. Dark: slate-800
   fill, slate-50 ink. Since `--accent` is `radix-nova`'s menu-item highlight role, every dropdown,
   context menu, select and combobox highlight loses its brand tint in dark. `--sidebar-accent`
   flips identically, so active nav does too. Whether that is intended is **unknowable** — the
   design has no dark theme to check it against.
2. **`--primary` does not lighten.** It stays `#166534` against a slate-950 canvas. That is a
   contrast-ratio question the design never had to answer, and it is the reason for D-dark-1 below.

#### D-dark-1 — the one value we changed rather than transcribed

`react/app/globals.css` sets `--primary-foreground: var(--color-slate-900)` in dark while leaving
`--primary` at `#166534`. That is **`#0F172A` on `#166534` — 2.50:1**, far below the 4.5:1 AA
floor for the label on every primary button in the app.

Held at **`#FFFFFF` (7.13:1)** instead. This is the only place in `globals.css` where a sourced
value was overridden rather than transcribed. It is **not** design-derived and has no baseline —
it is a legibility floor applied to a theme the design never specified. Reverting it to
`var(--color-slate-900)` restores fidelity-to-source at the cost of an unreadable button.

---

## 8. Starter-owned names the design never mentions

Recorded so the survivor list in the deviations table is complete:

`--font-sans` (set by `next/font` Inter in `layout.tsx`), `--font-heading`, `--radius-3xl`,
`--radius-4xl`, Tailwind's z-index scale, Tailwind's `sm/md/lg/xl/2xl` breakpoint widths
_(design explicitly confirms these are unchanged)_, Tailwind's spacing scale _(design confirms
4px base)_, Tailwind's `--text-*` steps _(design explicitly forbids overriding them)_, and
Tailwind's `--shadow-*` primitives _(design assigns roles, never values)_.

`--font-mono` is **no longer** on this list. It is design-declared
(`_ds/…/tokens/typography.css`) and, as of the JetBrains Mono addition to `layout.tsx`, actually
loaded — self-hosted, so `font-src 'self'` is satisfied.

---

## 9. Exceptions

Rows where the app's resolved value does **not** equal the design's declared value, and the
difference is being accepted rather than fixed. Each needs a signature.

**The three typography exceptions** — all line-height, all the same root cause:

| #      | Step                     | Design declares     | App resolves | Δ      |
| ------ | ------------------------ | ------------------- | ------------ | ------ |
| **E1** | `text-2xl` — page title  | `28.8px` (24 × 1.2) | `32px`       | +3.2px |
| **E2** | `text-xl` — record title | `26px` (20 × 1.3)   | `28px`       | +2.0px |
| **E3** | `text-sm` — body         | `22.4px` (14 × 1.6) | `20px`       | −2.4px |

**Why accepted rather than fixed.** Closing these means overriding `--text-2xl`, `--text-xl` and
`--text-sm` in `@theme`. Those steps are consumed by _every_ primitive — `button.tsx`,
`badge.tsx`, `input.tsx`, every menu item, every table cell. Re-leading `text-sm` alone changes
the vertical rhythm of every control in the app to fix the leading of prose. That is the same
failure mode as baking `font-weight` into a type step, which the design explicitly warns against,
and the design states the rule directly:

> _"No type-scale overrides. Sizes are `text-xs` → `text-4xl` only."_

Its own snippet applies leading as a per-role utility, not a scale value:
`<h1 className="text-2xl font-bold tracking-tight">`.

**What this costs.** Prose renders 2.4px tighter per line than designed. Visible in long body
copy (empty states, alert descriptions, settings help text), invisible in UI strings.

**How components must compensate.** Apply leading per role, never globally:

| Role         | Class                                                                |
| ------------ | -------------------------------------------------------------------- |
| Page title   | `text-2xl font-bold tracking-tight leading-[1.2]`                    |
| Record title | `text-xl font-bold tracking-tight leading-[1.3]`                     |
| Body prose   | `text-sm leading-relaxed` _(1.625 — 22.75px vs the declared 22.4px)_ |

> ⚠ `leading-relaxed` is 1.625, not 1.6. For exact prose use `leading-[1.6]`. Flagged because
> reaching for the named step is the obvious move and it is 0.35px off.

**The fourth exception** — radius:

| #      | Step           | Design declares | App resolves                          | Δ            |
| ------ | -------------- | --------------- | ------------------------------------- | ------------ |
| **E4** | `rounded-full` | `999px`         | `33554400px` (`calc(infinity * 1px)`) | none visible |

**Why accepted.** Both render as a full pill on any element below ~2000px; there is no reachable
viewport where they differ. The design writes `999px` only because its Interloid bundle predates
the Tailwind v4 static utility — `--radius-full:999px` is a _bridge_ name (§6), not a contract
token. Overriding Tailwind's built-in to gain a byte-identical string buys nothing and risks the
utility silently not regenerating.

### Sign-off — **SIGNED 2026-08-06**

| #   | Exception                          | Category impact             | Signed off by              | Date       |
| --- | ---------------------------------- | --------------------------- | -------------------------- | ---------- |
| E1  | `text-2xl` leading 32px vs 28.8px  | typography 87.5% → **100%** | signature of record, below | 2026-08-06 |
| E2  | `text-xl` leading 28px vs 26px     | typography 87.5% → **100%** | signature of record, below | 2026-08-06 |
| E3  | `text-sm` leading 20px vs 22.4px   | typography 87.5% → **100%** | signature of record, below | 2026-08-06 |
| E4  | `rounded-full` 33554400px vs 999px | radius 83.3% → **100%**     | signature of record, below | 2026-08-06 |

#### Signature of record

One signature covers all four. Reproduced verbatim; it is the authority for E1–E4 and must not
be paraphrased when quoted elsewhere.

> E1-E3 (line-heights), E4 (rounded-full) — accepted, permanent. Tailwind owns these scale
> values; the design overrides leading per-role, not per-scale. Components apply leading with
> arbitrary ratios, never named utilities: leading-[1.2] on text-2xl page titles, leading-[1.3]
> on text-xl section headings, leading-[1.6] on text-sm body and secondary text. Tailwind's
> named steps are 1.25 / 1.375 / 1.625 and none hit the designed values; leading-relaxed is
> wrong by 0.35px at 14px and accumulates visibly down a long list. E4 is a serialisation
> difference with no rendered consequence at any element size in this design. Signed 2026-08-06.

**Effect.** All four are now in force: `signedOn: "2026-08-06"` in
`src/features/token-audit/exceptions.ts`. Typography and radius both score 100%
(21 exact + 3 accepted; 5 exact + 1 accepted), and the gate — colour, radius and typography at
100% — is **met**. Accepted rows stay itemised by id on the board and in every score line, so
the debt remains visible rather than absorbed.

**These are permanent, not deferred.** Nothing here is scheduled to be revisited: the values
belong to Tailwind's scales, and the design's own rule is that leading is a per-role utility, not
a scale override. The obligation the signature creates is on _components_ — apply the arbitrary
ratios above, never the named steps.

**E4 equivalence, for the record.** §9 records the accepted value as `33554400px`; Chrome
serialises the same computed length as `3.35544e+07px`. Identical number, different notation.
`compare()` normalises numerically before equality, so the registry stays engine-independent —
Firefox and Safari may serialise large lengths differently again. `exceptions.ts` therefore
carries `33554400px`, matching this section exactly, and a unit test asserts §9 and the registry
agree so the two cannot drift apart silently.
