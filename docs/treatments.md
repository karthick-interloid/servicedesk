# Treatment extraction — `Design System.dc.html`

> A correct value applied the wrong way is still a fidelity failure. This file records **how the
> page applies** each token, every pattern citing the page's own CSS rule or declared markup.
> Line references are to `Design System.dc.html` (2343 lines).
>
> Nothing here is implementable in `globals.css` alone — these are the acceptance criteria for the
> component work that follows the token layer. Rows marked **⛔ blocked** are treatments the
> starter's stock `radix-nova` primitives currently contradict; they are named here so the gap is
> visible rather than silently absorbed.

---

## 1. Semantic-role check — how `radix-nova` actually consumes each slot

The precedent trap ("a cyan accent mapped literally turns every dropdown hover cyan") requires
verifying the _slot's role in this starter_, not shadcn-in-general. Measured by grep over all 38
files in `src/components/ui/`:

| Slot                       | Files that read it                                                                                                                         | Role in `radix-nova`                                                                              | Design's use of that value                                                                                                                        | Verdict                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--accent` / `-foreground` | `dropdown-menu`, `context-menu`, `select`, `combobox` **only** — as `focus:bg-accent`, `data-highlighted:bg-accent`, `data-open:bg-accent` | **Menu/list-item highlight surface.** Nothing else. Not ghost hover, not table rows, not sidebar. | Column-picker checked row `background:#DCFCE7; color:#166534`; combobox active option `background:#DCFCE7`, label `color:#166534;font-weight:600` | ✅ **Literal map is correct.** The design's own menu highlight _is_ `#DCFCE7`/`#166534`. No `--accent-brand` suffix needed. |
| `--muted`                  | 17 bare `bg-muted` + `hover:bg-muted` on `ghost` / `outline` button and badge                                                              | Neutral filler **and** ghost/outline hover                                                        | Ghost button hover is slate-100 (`ghost: "text-secondary-foreground hover:bg-secondary"`, `--secondary` = `#F1F5F9` = `--muted`)                  | ✅ Same colour either way.                                                                                                  |
| `--sidebar-accent`         | `sidebar.tsx`, on **both** `hover:` and `data-active:` (6 hits each)                                                                       | One value for hover _and_ active                                                                  | ⚠ Design conflicts with itself — see §2                                                                                                           | ⚠ flagged                                                                                                                   |
| `--secondary`              | `bg-secondary` on secondary Button and Badge                                                                                               | Filled neutral chip/button                                                                        | Design's secondary button is white + border, hovering _to_ slate-100                                                                              | ⛔ token right, component shape wrong                                                                                       |
| `--destructive`            | `bg-destructive/10 text-destructive` (Button, Badge)                                                                                       | Soft-by-alpha, never solid                                                                        | Design pairs `--destructive-soft` + `--destructive-strong`                                                                                        | ⛔ close, not exact                                                                                                         |
| `--ring`                   | `focus-visible:ring-ring/50` + `focus-visible:border-ring`                                                                                 | Focus indicator                                                                                   | Design specifies `ring-ring/30`                                                                                                                   | ⛔ opacity differs                                                                                                          |
| `--sidebar-primary`        | **0 hits** — unused by `radix-nova`'s `sidebar.tsx`                                                                                        | inert                                                                                             | Design: org avatar tile, count pills, sidebar CTA                                                                                                 | mapped but currently inert                                                                                                  |

**Conclusion on trap #1: it does not fire for `--accent` in this starter.** The one candidate that
looked dangerous is in fact exactly aligned, because `radix-nova` scopes `--accent` narrowly to
menu highlighting and routes ghost-hover through `--muted`. Mapping `#DCFCE7` literally is right,
and inventing `--accent-brand` would have been the error here.

---

## 2. The design's internal conflicts

Recorded, not resolved silently. Each needs a decision before the affected component ships.

| #   | Conflict              | Page's token table says                                                             | Page's markup says                                                                                                                  | Taken                                                                                                                   |
| --- | --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| T1  | Sidebar nav **hover** | `--sidebar-accent` covers _"Active **and hovered** nav item"_ → `#DCFCE7`/`#166534` | Nav specimen renders hover as `background:#F1F5F9; color:#334155` (slate-100)                                                       | **Token table** — the slot can only carry one value, and `radix-nova` binds hover and active to the same pair. Flagged. |
| T2  | Link hover            | `a:hover{color:#166534}` — identical to rest, no change                             | Brand swatch labels `#14532D` _"Pressed · **link hover**"_; bundle's surviving `--text-link-hover: var(--blue-pressed)` → `#14532D` | **`#14532D`** — two independent sources against one vestigial rule. Flagged.                                            |
| T3  | `--success` triple    | `customRows` "Resolves to" says `green-600 · 50 · 800`                              | `:root` declares `#12A150 / #E4F6EC / #0B7A3B`; `dupRows` and `a11yRows` both compute from the literals                             | **Literals.** (`DESIGN_SUMMARY` ambiguity #4.)                                                                          |
| T4  | Heading tracking      | Prose: _"Headings carry `-0.02em`"_; bundle `--tracking-tight: -0.02em`             | Every heading declares `letter-spacing:-0.025em`                                                                                    | **`-0.025em`** (= Tailwind `tracking-tight`).                                                                           |
| T5  | Page-title size       | Typography: `text-2xl · 24px`                                                       | Layout & shell: _"Title 22px"_                                                                                                      | **24px** — measured render is 24. (`DESIGN_SUMMARY` #6.)                                                                |
| T6  | Card radius           | Radius ladder: panels `14px` (`rounded-xl`)                                         | Component API: _"Card — 12px radius; 16px for plan cards"_                                                                          | **14px** — measured render is 14. (`DESIGN_SUMMARY` #5.)                                                                |
| T7  | Queue tracks          | Breakpoints table: _"All **six** fixed queue tracks"_                               | Data-display specimen: `40px 72px minmax(0,1fr) 92px 148px 128px` = 6; prototype renders 8                                          | 6 fixed + requester/assignee as _optional_ columns (Overlays §column picker says so explicitly).                        |
| T8  | `New` status tone     | `code.badges`: `New:"neutral"`                                                      | `react/lib/badge-tones.ts`: `New: BRAND`; prototype renders `#DCFCE7`/`#166534`                                                     | Unresolved — `DESIGN_SUMMARY` ambiguity #1. Not a token decision.                                                       |

---

## 3. Colour treatments

### 3.1 Status pill — the four-part recipe

> Page rule, `code.badges`: _"tone → classes (soft surface + strong text + 25% inset ring)"_ ·
> `success: "bg-success-soft text-success-strong ring-success/25"`
> Badges section: _"`border-radius: 9999px`, height 19–20px, `text-xs`"_

```
soft surface  +  strong text  +  ring-1 ring-inset ring-<tone>/25  +  rounded-full  +  text-xs
```

Confirmed against `react/lib/badge-tones.ts`, which is the design's own single source:

| Tone    | Surface                        | Text                               | Ring               | Contrast (page's `a11yRows`) |
| ------- | ------------------------------ | ---------------------------------- | ------------------ | ---------------------------- |
| neutral | `--secondary` `#F1F5F9`        | `--secondary-foreground` `#334155` | `--border`         | —                            |
| brand   | `--accent` `#DCFCE7`           | `--accent-foreground` `#166534`    | `--primary/20`     | 6.5:1 pass AA                |
| info    | `--info-soft` `#EEF2FF`        | `--info-strong` `#3730A3`          | `--info/25`        | 8.9:1 pass AAA               |
| success | `--success-soft` `#E4F6EC`     | `--success-strong` `#0B7A3B`       | `--success/25`     | 4.8:1 pass AA                |
| warning | `--warning-soft` `#FFFBEB`     | `--warning-strong` `#B45309`       | `--warning/25`     | 4.8:1 pass AA, at the limit  |
| error   | `--destructive-soft` `#FEF2F2` | `--destructive-strong` `#B91C1C`   | `--destructive/25` | 5.9:1 pass AA                |

**Dot rule** — Badges section, verbatim: _"A leading dot is added when the badge answers **what
state is this in** (status, SLA, health) and omitted when it answers **what kind is this**
(priority, plan, category)."_ Dot fill is the **base** of the triple, never the strong:
`slaDot = { success: "bg-success", warning: "bg-warning", error: "bg-destructive" }`.

**Count pills** — Badges §Tags & counts:

- nav count: `min-width:20px; height:20px; padding:0 6px; border-radius:999px; background:#DCFCE7; color:#166534; font-family:var(--font-mono); font-size:12px; font-weight:700`
- unread bell: `min-width:16px; height:16px; padding:0 4px; background:#DC2626; color:#fff; font-mono; font-weight:700` — the page's one sanctioned arbitrary size, `text-[10px]`, _"where the 12px floor doesn't fit a 16px circle."_

⛔ **blocked:** `badge.tsx` ships `default/secondary/destructive/outline/ghost/link` with
`bg-destructive/10`-style alpha soft. It has no `tone` prop and no inset ring. The six-tone recipe
needs a `tone` variant added to `badge.tsx` (or the `PILL` constant from `badge-tones.ts`).

### 3.2 The four-semantic quad, completed

Trap #2 asks that every status colour bridge **solid · text-on-solid · subtle · text-on-subtle**.
Where the page declares three of four, the fourth is derived from usage and contrast-checked
(WCAG 2.1 relative luminance, recomputed — my method reproduces the page's own `7.1:1` and
`6.5:1` figures exactly, so the numbers below are comparable to its table).

| Tone        | solid                     | **text-on-solid**                                                                                                     | subtle                                         | text-on-subtle                                        |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| brand       | `--primary` `#166534`     | `--primary-foreground` `#FFFFFF` — **declared**, 7.1:1 ✅                                                             | `--accent` `#DCFCE7`                           | `--accent-foreground` `#166534` — declared, 6.5:1 ✅  |
| destructive | `--destructive` `#DC2626` | `--destructive-foreground` `#FFFFFF` — **derived from usage** (unread bell `background:#DC2626;color:#fff`), 4.8:1 ✅ | `--destructive-soft` `#FEF2F2`                 | `--destructive-strong` `#B91C1C` — declared, 5.9:1 ✅ |
| info        | `--info` `#4F46E5`        | `--info-foreground` `#FFFFFF` — **derived**, no usage in page, 6.3:1 ✅                                               | `--info-soft` `#EEF2FF`                        | `--info-strong` `#3730A3` — declared, 8.9:1 ✅        |
| warning     | `--warning` `#D97706`     | ⚠ `--warning-foreground` — see below                                                                                  | `--warning-soft` `#FFFBEB`                     | `--warning-strong` `#B45309` — declared, 4.8:1 ✅     |
| success     | `--success` `#12A150`     | ⚠ `--success-foreground` — see below                                                                                  | `--success-soft` `#E4F6EC`                     | `--success-strong` `#0B7A3B` — declared, 4.8:1 ✅     |
| neutral     | `--secondary` `#F1F5F9`   | `--secondary-foreground` `#334155` — declared                                                                         | _(same pair)_                                  | _(same pair)_                                         |
| note        | _(no solid)_              | —                                                                                                                     | `--note` `#FEF3C7` + `--note-border` `#FDE68A` | `--note-foreground` `#92400E` — declared, 6.4:1 ✅    |

> ⚠ **Two accessibility completions requiring sign-off.**
>
> **`--warning-foreground`.** The design _does_ put white on solid amber — the note-author avatar,
> `background:#D97706; color:#fff; font-size:12px; font-weight:700` (Data display §Avatars).
> **`#FFFFFF` on `#D97706` = 3.19:1** — fails AA for 12px text (needs 4.5:1). Proposed passing
> ink: **`#0F172A`** (`--foreground`, slate-900) = **5.60:1** ✅.
>
> **`--success-foreground`.** The page never renders text on solid `#12A150` at all — `--success`
> appears only as a dot fill and a swatch. Sibling consistency implies white; **`#FFFFFF` on
> `#12A150` = 3.37:1**, also fails. Proposed passing ink: **`#0F172A`** = **5.30:1** ✅.
>
> This is filling a gap the design never had to solve, not overriding the design. Both are in the
> proposed CSS as `--success-foreground` / `--warning-foreground`, and both are flagged rows in
> the deviations table. Say the word and I'll swap either back to `#FFFFFF`.

### 3.3 Surfaces

| Surface                                | Rule (cited)                                                                                                                                | Token                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Page canvas                            | `body{background:#F8FAFC}` · Neutrals swatch _"slate-50 — page canvas"_                                                                     | `--background`                                                                 |
| Panel / card / table shell / auth card | `background:#fff; border:1px solid #E2E8F0; border-radius:14px; box-shadow:0 1px 2px 0 rgb(0 0 0 / .05)` — the recipe appears ~40× verbatim | `--card` + `--border` + `rounded-xl` + `shadow-xs`                             |
| Table header band                      | `background:#F8FAFC` on a white card — _"Header is a sunken band, sticky under the filter bar"_                                             | `--background` on `--card`                                                     |
| Row hairline                           | `border-top:1px solid #F1F5F9` · Color section: _"slate-100 — row hairline"_ · shadcn row: _"Inner row separators drop to slate-100"_       | `--muted` (`#F1F5F9`), **not** `--border`                                      |
| Row hover                              | `background:#F0FDF4` · Table anatomy: _"row above is `green-50` — hover tint, 2% brand"_                                                    | Tailwind `green-50`. **No token** — the page's 39 additions do not include it. |
| Row selected                           | `background:#DCFCE7` · _"Selected rows use the full brand-soft `green-100`"_                                                                | `--accent`                                                                     |
| Inverse — toast, tooltip               | `background:#0F172A; color:#fff` · Special surfaces: _"slate-900 · inverse surface"_                                                        | `--foreground` as bg, `--background`-ish as fg                                 |
| Scrim                                  | `rgba(15,23,42,.45)` · Overlays: _"All sit on a `rgba(15,23,42,.45)` scrim"_                                                                | literal                                                                        |
| Harness shell                          | `#020617` · _"slate-950 — chrome only, **not app UI**"_                                                                                     | not ported                                                                     |
| Agent message bubble                   | `border:1px solid #BBF7D0; background:#F0FDF4`                                                                                              | `green-200`/`green-50`                                                         |
| Internal note                          | `border:1px solid #FDE68A; background:#FEF3C7; color:#92400E`                                                                               | `--note-border` / `--note` / `--note-foreground`                               |

### 3.7 Doc-page chrome — `/design-system` only

> Scope: `components-map.md` §Doc-page, rows D1–D10. **Palette utilities are permitted here and
> nowhere else.** These surfaces deliberately have no tokens — the design's Special-surfaces block
> labels slate-950 _"chrome only, **not app UI**"_ — so a token would misrepresent them as part of
> the contract. In the 30 app screens, map rule 4 stands: colour through tokens only.

**Masthead band (D1)** — inverse doc chrome, one step darker than the app's inverse surface:

| Part        | Treatment                                                        |
| ----------- | ---------------------------------------------------------------- |
| Surface     | `bg-slate-950`                                                   |
| Bottom rule | `border-b border-slate-800`                                      |
| Status dot  | `bg-green-400`, `size-2 rounded-full`                            |
| Eyebrow     | `text-xs font-bold uppercase tracking-widest text-slate-500`     |
| Title       | `text-4xl font-bold tracking-tight text-slate-50 leading-[1.15]` |
| Description | `text-base text-slate-400 max-w-[74ch] leading-[1.65]`           |
| Stat figure | `font-mono text-lg font-bold text-slate-50`                      |
| Stat label  | `text-xs text-slate-500`                                         |

**Code block (D8)** — the app's inverse surface, reused; only the ink falls outside the contract:

| Part    | Treatment                                                              |
| ------- | ---------------------------------------------------------------------- |
| Surface | `bg-foreground` — exact, this _is_ `--foreground`                      |
| Ink     | `text-slate-300` — no token; the contract has no "ink on inverse" name |
| Type    | `font-mono text-xs leading-[1.75]`                                     |
| Shape   | `rounded-lg p-4`, horizontal scroll via `ui/scroll-area.tsx`           |

**Doc nav item (D3)** — distinct from the app nav item in §5.5, which is 36px tall with 8px radius:

| State       | Treatment                                                                |
| ----------- | ------------------------------------------------------------------------ |
| Idle        | `text-sm font-medium text-secondary-foreground px-2.5 py-1.5 rounded-sm` |
| Active      | adds `bg-accent text-accent-foreground`                                  |
| Group label | `text-xs font-bold uppercase tracking-widest text-muted-foreground`      |

Only the idle ink and the group label resolve to tokens (`--secondary-foreground`,
`--muted-foreground`); the geometry is the doc page's own and is smaller than §5.5's throughout.

---

### 3.4 Alert / banner

> Alerts section: _"Soft-tinted surface, matching 1px border, strong-tone text, 18px icon."_
> `border-radius:10px; padding:14px 16px; gap:12px; align-items:flex-start`

The border is **not** the `/25` ring of the badge — it is a literal one-step-up palette value:

| Tone    | Surface                  | Border                 | Text + icon stroke      |
| ------- | ------------------------ | ---------------------- | ----------------------- |
| error   | `#FEF2F2`                | `#FECACA` (red-200)    | `#B91C1C`               |
| warning | `#FFFBEB`                | `#FDE68A` (amber-200)  | `#B45309`               |
| success | `#F0FDF4` (green-**50**) | `#BBF7D0` (green-200)  | `#166534` (`--primary`) |
| info    | `#EEF2FF`                | `#C7D2FE` (indigo-200) | `#3730A3`               |

⚠ Note the success alert uses `green-50` / `--primary`, **not** the `--success-soft` /
`--success-strong` triple the pill uses. The page's own snippet reconciles this as
`border-destructive/25 bg-destructive-soft text-destructive-strong` — i.e. the _snippet_ says
`/25` ring, the _markup_ says literal 200-step border. Markup and snippet disagree; both are
recorded. **Not a token decision** — no new token either way.

Icon tile inside a card-level alert: `36px square, border-radius:10px, tone-soft bg, tone-strong glyph`.
Icons section generalises: _"Icon tiles: 30–38px square, 8–10px radius, tone-soft background with
tone-strong glyph."_

---

## 4. Typography treatments

> Page rule: _"Inter for everything readable, JetBrains Mono for anything a user might copy —
> ticket IDs, amounts, IPs, DNS records, API keys… Sentence case throughout."_

**Weight is a per-role treatment, never baked into a `--text-*` step.** Trap #4. Baking
`font-weight:700` into `--text-2xl` would bold every default string in every primitive.

| Role                     | Utilities                                      | Weight                    | Cited from                                                                            |
| ------------------------ | ---------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| Page title               | `text-2xl tracking-tight` (`-0.025em`), lh 1.2 | **700**                   | `<h1 style="font-size:24px;font-weight:700;letter-spacing:-0.025em;line-height:1.2">` |
| Record title             | `text-xl tracking-tight`, lh 1.3               | **700**                   | Typography row 2                                                                      |
| Section heading          | `text-lg`                                      | **600**                   | Typography row 3                                                                      |
| Card title               | `text-base`                                    | **600**                   | Typography row 4                                                                      |
| Body                     | `text-sm leading-[1.6]`                        | **400**                   | Typography row 5 · `color:#475569` = slate-600                                        |
| Table row primary        | `text-sm`                                      | **600**                   | Typography row 6 · `color:#0F172A`                                                    |
| Meta & caption           | `text-xs`                                      | **400**                   | `color:#64748B` = `--muted-foreground`                                                |
| Eyebrow / nav group      | `text-xs uppercase tracking-widest` (`0.1em`)  | **700**                   | `color:#94A3B8` = slate-400                                                           |
| IDs, money, IPs, secrets | `font-mono text-xs`→`text-sm tabular-nums`     | 400 / 650–700 for metrics | `<span style="font-family:var(--font-mono)">` throughout                              |
| Stat-tile figure         | `font-mono text-2xl tracking-tight`            | **700**                   | Cards §stat tiles                                                                     |
| Plan price               | `font-mono text-[30px] tracking-tight`         | **700**                   | Cards §plan card                                                                      |

**Body copy colour is `#475569` (slate-600), not `--foreground`.** The page's body specimen and
every prose paragraph use slate-600; `--muted-foreground` (slate-500) is reserved for hints,
timestamps and placeholders. The page's `a11yRows` names this _"text-secondary on card — slate-600
on white — 7.6:1 — pass AAA."_ There is **no shadcn token for it** — it lives in the bundle bridge
as `--text-secondary: #475569`. Nearest contract token is `--foreground` (too dark) or
`--muted-foreground` (too light). ⚠ Flagged: prose should use an explicit `text-slate-600`, or the
project accepts `--muted-foreground` for body copy at 4.8:1.

**`font-weight:650`** appears 8× in the page (`font-weight:650` on swatch labels, stat labels,
`6 / 10` figures). Inter is a variable font, so 650 is renderable. Tailwind has no `font-650`
step; nearest named steps are `font-semibold` (600) and `font-bold` (700). ⚠ Flagged as a
sub-token detail — treat as `font-semibold` unless the variable axis is wired.

**Root font-size stays 16px.** Trap #3. The page declares no `font-size` on `html` or `body`; the
whole scale is expressed in px against the 16px default, and the rem values in the bundle
(`--text-small: 0.875rem` = 14px) confirm the 16px basis. No `html { font-size }` is added, and
none should be.

---

## 5. Component treatments

### 5.1 Button

> Page rule, `code.buttons`:
>
> ```
> default:     "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-green-900"
> secondary:   "border border-input bg-card shadow-xs hover:bg-secondary"
> ghost:       "text-secondary-foreground hover:bg-secondary"
> destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90"
> focus:       "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]"
> sizes:  sm "h-11 md:h-8 px-3" · default "h-11 md:h-10 px-4" · lg "h-12 px-6"
> ```
>
> Brand swatch: hover `#15803D` (green-700), pressed `#14532D` (green-900).
> Elevation §hover model: _"Actions lighten toward `bg-primary/90` and darken to `bg-primary/80`."_
> Motion: `duration-200 ease-out`, `scale .98` press, _"No bounce, ever."_
> Sizes: _"every button floors at 44px below `md:`"_ · `rounded-lg` (10px).
> States: _"Loading keeps the label and swaps in a spinner — the button never collapses or changes
> width."_ · Disabled `disabled:opacity-50`.

⛔ **blocked, 5 ways.** `radix-nova`'s `button.tsx`: `default` hovers `bg-primary/80` (design:
`/90`); `secondary` is `bg-secondary` filled (design: `bg-card` + `border-input`); `ghost` hovers
`bg-muted` (design: `bg-secondary` — same colour, different token); `destructive` is
`bg-destructive/10 text-destructive` (design: solid `bg-destructive text-white`); sizes are
`h-8 / h-9 / h-7` with **no 44px mobile floor**; focus is `ring-ring/50` (design: `/30`); press is
`translate-y-px` (design: `scale .98`). None of this is fixable in `globals.css`.

Toolbar ghost — the queue filter-bar variant, rendered literally:
`height:36px; padding:0 12px; border-radius:8px; border:1px solid #E2E8F0; background:#fff; color:#334155; font-size:14px; font-weight:600`,
active filter → `border:1px solid #166534; background:#DCFCE7; color:#166534`.

### 5.2 Form controls

> Page rule: _"Every field is label-above, 6px radius, 44px tall on mobile and 40px on desktop.
> Hints sit under the field in muted text and are **replaced — not joined —** by the error message."_
> `code.forms`: `Input: h-11 md:h-10 rounded-sm border-input` ·
> `focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]` ·
> `aria-invalid:border-destructive`
> Advanced inputs: _"All inherit the Input shell — 6px radius, `--input` border, 3px focus ring."_

| Control                       | Metrics (declared)                                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input / Select / Textarea     | `h-11 md:h-10`, `rounded-sm` (6px), `border-input` `#CBD5E1`; textarea measured 132px                                                                     |
| Search field                  | `height:36px; padding:0 12px; border:1px solid #CBD5E1; border-radius:8px`, leading 16px icon `stroke:#94A3B8`, trailing `/` keycap                       |
| Row checkbox                  | `20px; border-radius:6px; border:1px solid #CBD5E1; background:#fff` → checked `border+bg:#166534; color:#fff` → disabled `background:#F1F5F9`            |
| Header checkbox indeterminate | `#166534` fill + `8px × 2px` white bar, `border-radius:1px`                                                                                               |
| Radio                         | `16px; border-radius:50%`; selected = `border:5px solid #166534; background:#fff`                                                                         |
| Switch                        | `44px × 24px`                                                                                                                                             |
| Keycap                        | `border:1px solid #E2E8F0; border-bottom-width:2px; border-radius:6px; padding:4px 6px; background:#F8FAFC; font-mono 12px/700; color:#334155`            |
| Dropzone                      | `border:1.5px dashed #CBD5E1; border-radius:10px; background:#F8FAFC` → drag-over: _"the border and icon tile go brand and the surface tints brand-soft"_ |
| Required marker               | `<span style="color:#B91C1C">*</span>` — `--destructive-strong`, not `--destructive`                                                                      |

**Focus indicator — two parts, both required.** Accessibility §Focus: _"a 1–2px `border-ring`
solid, which carries the 3:1 non-text contrast SC 1.4.11 asks for (3.3:1 on white), plus a 3px
`ring-ring/30` halo as a secondary cue at 1.4:1. **Never remove either — restyle only.**"_
⛔ `radix-nova` ships `ring-ring/50`; the design wants `/30`.

**Known deviation the page itself declares** (Forms §intro): _"the bundle's error Input hardcodes
its focus glow at the stock Interloid red, so the Password specimen below shows a red that exists
nowhere else in the system — the React port uses `aria-invalid:ring-destructive/25` instead."_
Do not extract that red.

### 5.3 Card

> Cards §intro: _"All white, all hairline-bordered, **elevation only on hover or selection**."_
> Elevation §hover model: _"Cards raise one elevation step and shift up 1px."_
> Plan card: _"Selected state is a 1px brand border plus a 3px brand-soft ring — **never a colour fill**."_
> → `background:#fff; border:1px solid #166534; border-radius:16px; box-shadow:0 0 0 3px rgb(22 101 52 / .16)`

Padding: `gap-4` (16) mobile → `p-6` (24) desktop; specimens render `padding:16px` (stat tile,
list panel head) and `padding:20px` (documentation panels).

### 5.4 Table / queue row

> Data display: _"a CSS grid, **not a table layout**, so columns can be dropped by breakpoint. 44px
> rows on desktop, 52px on mobile, hairline separators, brand-soft tint when selected."_
> Table anatomy: _"Hairline separators, **never zebra striping**… Header is a sunken band, sticky
> under the filter bar. Sort is a single active column with a directional caret."_
> Accessibility §Tables: _"Real `th` with `scope` and `aria-sort` on the active column, even though
> layout is CSS grid."_

- Desktop tracks (page's own caption): `40px 74px minmax(0,1fr) 92px 150px 128px`
  _(the rendered specimen uses `40px 72px minmax(0,1fr) 92px 148px 128px` — 2px drift, page notes 74/150)_
- Below `xl:`: `36px 64px minmax(0,1fr) 84px` — assignee and SLA drop
- Below `md:`: row becomes a card
- Header: `height:40px; background:#F8FAFC; text-xs/700; letter-spacing:0.05em; uppercase; color:#94A3B8`
- Active sort header: `color:#166534` + 12px caret, `stroke-width:2.4`. _"inactive headers show no
  caret at all — not a greyed one."_
- Row: `min-height:44px; padding:0 14px; gap:10px; border-top:1px solid #F1F5F9`
- Bulk bar: `padding:12px 14px; background:#F8FAFC`, `1 selected` in `#166534`/600
- Expanded row: _"Indents to the first content column, keeps the row's hairline, adds no border of its own."_
- Truncation: _"Subject truncates with an ellipsis on one line and carries a tooltip. Names
  truncate; IDs, badges and timestamps **never** do — they get fixed tracks instead."_

### 5.5 Navigation

> Nav §intro: _"Active is brand-soft fill with a brand-ink label — **never a left border**. When
> collapsed to the 72px rail, labels become tooltips."_

- item: `min-height:36px; padding:0 12px; border-radius:8px; font-size:14px`
- active: `background:#DCFCE7; color:#166534; font-weight:600` + trailing mono count `font-weight:700`
- hover: `background:#F1F5F9; color:#334155; font-weight:500` ← see conflict **T1**
- idle: no background, `color:#334155; font-weight:500`
- "soon": `color:#94A3B8; cursor:not-allowed` + `Soon` eyebrow, `letter-spacing:0.05em`
- group eyebrow: `text-xs/700; letter-spacing:0.1em; uppercase; color:#94A3B8; padding:10px 12px 2px`
- rail: `72px` wide, `40px` square icon slots, `border-radius:8px`
- tooltip: `background:#0F172A; color:#fff; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600` — _"fixed-positioned so they escape the scroll container"_
- mobile sheet: `272px`, `44px` rows, `~220ms` slide, scrim `rgba(15,23,42,.45)`

View tabs (from `renderVals()`): `min-height:34px; padding:0 12px; border-radius:8px; font-size:13px; font-weight:600`,
active `border:1px solid #166534; background:#DCFCE7; color:#166534`, idle `border:1px solid #E2E8F0; background:#fff; color:#475569`,
`transition: background 150ms ease-out, border-color 150ms ease-out`.
Pagination pill: `min-width:30px; height:30px; border-radius:7px; font-mono 12px/600`, active = solid `#166534` on white text.

### 5.6 Overlays

> _"Four overlay types, one rule each: dialogs interrupt, sheets navigate, menus choose, trays
> inform. All sit on a `rgba(15,23,42,.45)` scrim, close on Esc and on scrim click — **except
> destructive confirms, which require an explicit choice**."_

- Dropdown menu shell: `padding:6px; border-radius:10px; shadow-lg`; items `min-height:32px;
padding:0 10px; border-radius:6px` (the page's caption says _"6px padding shell, 34px rows, 7px
  item radius"_ — caption vs markup drift of 2px/1px, recorded)
- Checked menu item: `background:#DCFCE7; color:#166534; font-weight:600` → **this is `--accent`**
- Popover / tray: `border-radius:14px; shadow-lg`
- Dialog: `max-width:360px; border-radius:14px; padding:20px; shadow-xl`
- Unread tray row: `background:#F0FDF4` + trailing `6px` `#166534` dot — _"never bold-only, which
  reads as emphasis rather than state"_

### 5.7 Skeleton

> _"Skeletons mirror the real layout — same row height, same column widths, same card shape — so
> nothing shifts when data lands. Bars are **`slate-200`** on white, pulsing opacity .45→1 over
> 1.3s. Never a spinner where a skeleton will do."_
> `@keyframes sdp-sk{0%{opacity:.45}50%{opacity:1}100%{opacity:.45}}` · `animation:sdp-sk 1.3s ease-in-out infinite`

⛔ `skeleton.tsx` is `animate-pulse rounded-md bg-muted` — `bg-muted` is `#F1F5F9` (slate-**100**),
and Tailwind's `animate-pulse` is **2s**, not 1.3s. Design wants `#E2E8F0` at 1.3s. The React port
solves it with a `@utility skeleton-pulse` and would need `bg-border` at call sites.

Bar geometry: `height:8–12px; border-radius:6px`; pill placeholders `height:16px; border-radius:999px`;
avatar `32px; border-radius:50%`; skeleton table row height **48px** (vs live row 44px).

### 5.8 Loaders & progress

Spinner: `border:2px solid #E2E8F0; border-top-color:#166534; border-radius:50%;
animation:interloid-spin .7s linear infinite`, 16px inline / 28px block (3px border).
Progress track `height:8px; border-radius:999px; background:#F1F5F9`; fill `border-radius:999px`.

> _"Bar tone follows the thing measured, not the value — priority bars use the priority tone so the
> reports page stays scannable."_
> Rendered: seats `#166534`, urgent-SLA `#DC2626`, normal-SLA `#16A34A`.

### 5.9 Charts

> _"Five series, no two from the same hue family — never a rainbow. Gridlines are horizontal only
> at `slate-100`, axis labels are `font-mono text-xs`, and **no chart carries a border of its own:
> the card provides it**."_

- Axis baseline `1px #E2E8F0`; gridlines `1px #F1F5F9`; bar `border-radius:4px 4px 0 0`
- Out-of-hours bars → `--chart-muted` `#CBD5E1`: _"outside business hours is context, not a data series"_
- Tooltip: `background:#0F172A; border-radius:8px; padding:8px 10px`, label `#94A3B8`, value
  `#fff/600`, comparison `#CBD5E1`, `8px` swatch `border-radius:2px`
- No-data: _"Axes and gridlines stay; only the series is absent. A collapsed chart shifts the whole
  card and reads as an error."_

### 5.10 Avatars

`border-radius:50%`, `font-size:12px; font-weight:700`, sizes 24 / 32 / 34 / 36px.

> _"Brand fill for agents, slate for customers, amber for note authors, 200-grey for unassigned."_

`#166534`/white · `#64748B`/white · `#D97706`/white ⚠ **3.19:1, see §3.2** · `#E2E8F0`/`#64748B`.

---

## 6. Motion, layout and elevation

> Elevation §Motion, verbatim rows:
> `duration-200` — background, border, colour, `ease-out` · Radix default — mobile sheet slide ·
> `scale .98` — press feedback, _"No bounce, ever."_ · `1.3s loop` — skeleton pulse `.45 → 1 → .45` ·
> `550ms` — loading flash on route change · `3200ms` — toast lifetime

> Layout §Measurements, verbatim:
>
> ```
> sidebar   w-64 256 expanded · w-18 72 rail · w-72 288 at wide:
> top bar   h-14 56, sticky, hairline base
> page pad  p-4 16 → p-6 24 → p-8 32 / p-12 48
> content   max-w-[2040px], centred
> section gap  gap-5 20 · card gap gap-4 16
> ```

Breakpoint behaviours, verbatim from the Breakpoints table:

| Step    | Width  | Behaviour                                                                                |
| ------- | ------ | ---------------------------------------------------------------------------------------- |
| base    | < 640  | Queue becomes cards, sidebar becomes a 272px sheet, 44px targets, `p-4`                  |
| `sm:`   | ≥ 640  | Two-column forms, 40px controls, filter bar stops wrapping                               |
| `md:`   | ≥ 768  | Table returns in place of cards, 36px controls, `p-6`                                    |
| `lg:`   | ≥ 1024 | Sidebar is permanent — 256px expanded, 72px icon rail collapsed                          |
| `xl:`   | ≥ 1280 | All six fixed queue tracks fit                                                           |
| `2xl:`  | ≥ 1536 | Reports go three-up; room for the picker's optional columns                              |
| `wide:` | ≥ 1800 | 288px sidebar, `p-8`/`p-12`, content capped at `max-w-[2040px]` — **the one added step** |

Sticky save bar shadows **upward**: `box-shadow:0 -10px 15px -3px rgb(0 0 0 / .1)`.

Settings description column: `grid-template-columns: minmax(0,240px) minmax(0,1fr); gap:24px`,
_"Collapses to a single stacked column below `md:`, description first."_

---

## 7. Hard interaction rules the design imposes

1. **Hide, don't disable.** _"A nav item a role can never use is absent, not greyed. Disabled is
   reserved for something the same user could enable."_
2. **Never colour alone.** _"Every status pill pairs its tone with text, and SLA pills add a dot."_
3. **`aria-live`:** SLA countdowns `off`, toasts `polite`, breach alerts `assertive`.
4. **`IconButton` requires `label`** — becomes both tooltip and `aria-label`. _"A rail icon with no
   label is a bug."_
5. **Reduced motion:** skeleton pulse and sheet slide resolve instantly.
6. **Adherence rules** (Next.js §): no new hex in components · status colour only from
   `badge-tones` · no `gray-*`/`zinc-*` · `gap` not margins · one primary button per view ·
   all four list states before shipping.

Everything not listed under _States specified_ in `DESIGN_SUMMARY.md` is **undefined, not
missing**, and inherits shadcn/Radix defaults. Do not invent bespoke treatments for it.

---

## 8. Treatment-level blockers, collected

Nothing below is fixable in `globals.css`. Each needs component work, which the current task
forbids. Listed so the token layer isn't mistaken for a finished re-skin.

| #   | Component      | Design wants                                                         | `radix-nova` ships                               |
| --- | -------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| B1  | `button.tsx`   | `secondary` = `bg-card` + `border-input`                             | `bg-secondary` filled                            |
| B2  | `button.tsx`   | `destructive` = solid `bg-destructive text-white`                    | `bg-destructive/10 text-destructive`             |
| B3  | `button.tsx`   | `h-11 md:h-8 / h-11 md:h-10 / h-12` (44px mobile floor)              | `h-7 / h-8 / h-9`, no floor                      |
| B4  | `button.tsx`   | `hover:bg-primary/90`, `active:bg-primary/80`, `scale .98`           | `hover:bg-primary/80`, `translate-y-px`          |
| B5  | all            | `focus-visible:ring-ring/30`                                         | `focus-visible:ring-ring/50`                     |
| B6  | `badge.tsx`    | 6-tone `tone` prop, soft + strong + `ring-<tone>/25`, `rounded-full` | 6 _variants_, alpha soft, `rounded-4xl`, no ring |
| B7  | `skeleton.tsx` | `#E2E8F0` bars, 1.3s pulse                                           | `bg-muted` (`#F1F5F9`), 2s `animate-pulse`       |
| B8  | `input.tsx`    | `h-11 md:h-10`, `rounded-sm` (6px)                                   | stock heights, stock radius                      |
| B9  | `sidebar.tsx`  | hover ≠ active (**T1**)                                              | one `--sidebar-accent` for both                  |
| B10 | `layout.tsx`   | JetBrains Mono via `next/font` (CSP blocks the design's CDN import)  | Inter only; no `--font-mono` source              |

---

## 9. Sync addendum — 2026-08-07 (design revision `1786086815428077`)

**Everything above that names `#DCFCE7` / green-100 as the selected-state surface is superseded.**
The values are kept in place rather than rewritten so the reasoning history stays readable.

| Was                                         | Now                                                           | Affects                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--accent` `#DCFCE7` (green-100)            | **`#E7F1F1`** — reference-exact, not a Tailwind primitive     | §1 (semantic-role check), §3.1 brand pill, §3.3 row selected, §5.5 nav active, §5.6 checked menu item |
| `--accent-foreground` `#166534` (green-800) | **`#0F766E`** (teal-700)                                      | same                                                                                                  |
| `--sidebar-accent` / `-foreground`          | **`#E7F1F1`** / **`#0F766E`**                                 | §2 T1, §5.5                                                                                           |
| —                                           | **new `--brand-soft` / `--brand-ink`** — the same pair, named | §Custom variables (41 added names, was 39)                                                            |

**Conflict T2 is now RESOLVED by the design itself.** The page's stylesheet gained
`a:hover{color:#14532D}`, which is what this file had already taken. `#14532D` is
`--brand-pressed` in `react/app/globals.css`, so it enters as a token, not a literal.

**§1's conclusion still holds, and is now stronger.** The trap it tested for — _"a cyan accent
mapped literally turns every dropdown hover cyan"_ — is exactly what this revision risks, because
`radix-nova` scopes `--accent` to menu/list-item highlighting. The design intends precisely that:
`--accent` is now _defined_ as the selected-state surface, and its own §Custom variables says
"green-100 stays badge-only". Mapping `#E7F1F1` literally remains correct.

**§5.7 skeleton pulse:** the React port now ships `@utility skeleton-pulse` (1.3s). Transcribed
into `globals.css`. Blocker ⛔ B7 is half-cleared — see `docs/DIFFERENCE-LIST.md` D-4.

⚠ **Not resolved by this revision:** T8 (`New` status tone), and the corrupted `dupRows` prose
(`DESIGN_SUMMARY` #12) is still spliced mid-sentence upstream.
