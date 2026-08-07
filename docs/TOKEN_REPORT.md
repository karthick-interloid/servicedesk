# Token report — `src/app/globals.css` vs `Design System.dc.html`

**Run 2 — post-fix.** The one genuine defect (`--font-mono` face never loaded) is **fixed**.
Colour, shadow, spacing and other now pass at 100%. Radius (83.3%) and typography (87.5%) remain
below gate and carry **4 exceptions (E1–E4)** documented in `docs/tokens.md` §9 — **all four are
still unsigned**. Per the gate, components do not start until they are signed.

|                      |                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| Measured from        | `/dev/tokens`, resolved via `getComputedStyle`, Chrome 1440×1200                       |
| Page identity proven | `<title>Token board \| Starter Template>` + `INTERLOID · SERVICEDESK PRO` eyebrow      |
| Reference            | `design-reference/design-system--light--part01…04.png`                                 |
| Captures             | `verification/token-board--{light,dark}--*.{jpg,png}` (20 files, re-captured post-fix) |
| Themes               | light **scored**; dark **unscored** — the design declares no dark theme                |

### What changed since run 1

| Change                                                   | File                                                                             | Effect                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Added `JetBrains_Mono` via `next/font/google`            | `src/app/layout.tsx`                                                             | Face self-hosted, so `font-src 'self'` is satisfied; zero Google Fonts requests in the served HTML                                                                                                                                                                                  |
| Removed the literal font stack shadowing the loaded face | `src/app/globals.css:35`                                                         | Was `--font-mono: "JetBrains Mono", ui-monospace, …` — a literal in `@theme inline` **shadows** the `--font-mono` next/font sets on `<html>`, so the loaded face would never have been used. Now `--font-mono: var(--font-mono)`, mirroring the existing `--font-sans` indirection. |
| Comparator canonicalisation + 22 unit tests              | `src/features/token-audit/tokens.ts`, `test/features/token-audit/tokens.test.ts` | Pins the shadow-chain / colour-format normalisation so the run-1 false negatives cannot regress, and pins that genuine differences still fail                                                                                                                                       |
| Exceptions E1–E4 and the dark override table             | `docs/tokens.md` §7, §9                                                          | Sign-off table added                                                                                                                                                                                                                                                                |

**Verified, not assumed:** `<html class="… jetbrains_mono_d5591ac2-module__D88TVW__variable">` is
present in the served markup, the page makes **0** requests to `fonts.googleapis.com` /
`fonts.gstatic.com`, and the rendered mono specimen shows JetBrains Mono's signature dotted zero
— see `verification/token-board--light--12-mono-face-jetbrains.png`.

No token value changed. No `--text-*` step changed. No file in `src/components/ui/` was touched.

> **Comparator note.** A first pass reported 5 false failures — all four shadows and the scrim.
> Cause: Tailwind v4 composes `box-shadow` from five `--tw-*` slots, so the computed value carries
> four `rgba(0, 0, 0, 0) 0px 0px 0px 0px` placeholders and serialises the colour _first_, while CSS
> authors write it _last_; and the browser normalises `.45` → `0.45`. Those are serialisation
> artefacts, not value differences. `compare()` in `src/features/token-audit/tokens.ts` now
> canonicalises both before comparing. **Every number below is post-fix.** Had the report been
> written from the first pass it would have reported a 0% shadow category, entirely spuriously.

---

## Match score

Exact-value matches ÷ design-declared values. "Exact" = same **value**; hex↔rgb, `.45`↔`0.45`
and Tailwind's composed shadow chain are normalised, genuine differences are not.

| Category       | Run 1 | **Run 2**   | Declared | Exact | Gate | Result                |
| -------------- | ----- | ----------- | -------- | ----- | ---- | --------------------- |
| **Colour**     | 100%  | **100%**    | 56       | 56    | 100% | ✅ pass               |
| **Typography** | 87.5% | **87.5%**   | 24       | 21    | 100% | ❌ **E1–E3 unsigned** |
| **Radius**     | 83.3% | **83.3%**   | 6        | 5     | 100% | ❌ **E4 unsigned**    |
| **Shadow**     | 100%  | **100%**    | 4        | 4     | ≥95% | ✅ pass               |
| **Spacing**    | 100%  | **100%**    | 9        | 9     | ≥95% | ✅ pass               |
| **Other**      | 75%   | **100%** ▲  | 4        | 4     | —    | ✅ pass               |
| **Overall**    | 95.1% | **96.1%** ▲ | 103      | 99    |      |                       |

The only movement is **Other 75% → 100%**: `--font-mono` now resolves to a loaded face. The four
remaining failures are all scale values Tailwind owns, and all four are the documented exceptions
— nothing new appeared, and nothing regressed.

### Colour — 56/56

18 shadcn contract · 8 sidebar · 6 chart (incl. `--chart-muted`) · 14 semantic triples ·
1 declared text-on-solid · 9 design-values-with-no-token. **No failing rows.**

Three unscored (design silent): `--info-foreground`, `--success-foreground`,
`--warning-foreground` — see _Recommendations_.

### Typography — 21/24. Failing rows:

| Role                   | Property    | Design declares  | App resolves | Cause                                    |
| ---------------------- | ----------- | ---------------- | ------------ | ---------------------------------------- |
| Page title `text-2xl`  | line-height | **28.8px** (1.2) | 32px         | Tailwind stock `--text-2xl--line-height` |
| Record title `text-xl` | line-height | **26px** (1.3)   | 28px         | Tailwind stock `--text-xl--line-height`  |
| Body `text-sm`         | line-height | **22.4px** (1.6) | 20px         | Tailwind stock `--text-sm--line-height`  |

Size 9/9 exact · weight 9/9 exact · tracking 3/3 exact (`tracking-tight` = `-0.025em` and
`tracking-widest` = `0.1em` are byte-identical to the design). **Only line-height fails.**

### Radius — 5/6. Failing row:

| Step           | Design declares | App resolves                        | Cause                      |
| -------------- | --------------- | ----------------------------------- | -------------------------- |
| `rounded-full` | **999px**       | 33554400px (`calc(infinity * 1px)`) | Tailwind v4 static utility |

`sm 6px · md 8px · lg 10px · xl 14px · 2xl 16px` all exact.

### Shadow — 4/4, and no aliasing shift

The unassigned ladder confirms the roles point at the right rungs: `shadow-xs` = the design's
Rest, `sm` = Control, `lg` = Overlay, `xl` = Sheet/dialog. `2xs`, `md` and `2xl` are present and
unused, exactly as the design intends. Nothing is shifted a step.

### Other — 4/4 ▲ (was 3/4)

| Item                | Declared           | Run 1                                                                                   | Run 2                                                                                         |
| ------------------- | ------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--font-mono` face  | `"JetBrains Mono"` | ❌ token declared it, face never loaded — every mono string fell back to `ui-monospace` | ✅ self-hosted via `next/font`, shadowing literal removed, dotted zero verified in the render |
| `--font-sans`       | Inter              | ✅                                                                                      | ✅                                                                                            |
| `--radius` base     | `0.625rem`         | ✅                                                                                      | ✅                                                                                            |
| `--breakpoint-wide` | `1800px`           | ✅                                                                                      | ✅                                                                                            |

---

## Missing tokens

Declared and used by the design; **no token exists** because the design's own 39-name addition
list omits them. All nine render at the correct literal value today, so this is a naming gap, not
a colour defect — but every one is a hex a component author must hardcode, which the design's own
adherence rule #1 forbids ("No new hex codes in components — extend `globals.css`").

| Design value         | Role                                               | Nearest existing token                    | Consequence                                                  |
| -------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `#15803D` green-700  | Primary button **hover**                           | —                                         | `hover:bg-primary/90` approximates it; not the same colour   |
| `#14532D` green-900  | Primary **pressed** + link hover                   | —                                         | design writes `active:bg-green-900`, a literal palette class |
| `#475569` slate-600  | **All body copy**                                  | `--muted-foreground` (#64748B, too light) | 7.6:1 vs 4.8:1 — a real contrast drop if substituted         |
| `#F0FDF4` green-50   | Table **row hover**, agent bubble, unread tray row | `--accent` (#DCFCE7, too strong)          | row hover would read as row _selected_                       |
| `#BBF7D0` green-200  | Success alert border                               | —                                         |                                                              |
| `#FECACA` red-200    | Error alert border                                 | —                                         |                                                              |
| `#C7D2FE` indigo-200 | Info alert border                                  | —                                         |                                                              |
| `#94A3B8` slate-400  | Eyebrows, captions                                 | —                                         | 2.6:1 — decorative only                                      |
| `rgba(15,23,42,.45)` | Overlay scrim                                      | —                                         | Radix/shadcn supplies its own                                |

---

## Incorrect tokens

**None.** Every token that exists carries the design's declared value verbatim. The four failing
rows above are _scale_ values Tailwind owns (`--text-*` line-heights, `rounded-full`), not
mis-set tokens.

---

## Duplicate tokens

Same value under multiple names. All are **stated purpose**, none accidental — the design's own
`dupRows` audit covers each:

| Pair                                                                                                                        | Shared value | Design's stated reason                                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `--secondary` / `--muted`                                                                                                   | `#F1F5F9`    | shadcn's own default; the _foregrounds_ differ (slate-700 vs slate-500) and carry the distinction |
| `--primary` / `--chart-1`                                                                                                   | `#166534`    | "Intentional: the primary chart series IS the brand"                                              |
| `--primary` / `--accent-foreground` / `--sidebar-primary` / `--sidebar-accent-foreground`                                   | `#166534`    | One brand ink across four roles                                                                   |
| `--accent` / `--sidebar-accent`                                                                                             | `#DCFCE7`    | Same brand-soft surface, two scopes                                                               |
| `--ring` / `--sidebar-ring` / `--chart-2`                                                                                   | `#16A34A`    | green-600 as focus indicator and comparison series                                                |
| `--card` / `--popover` / `--sidebar` / `--primary-foreground` / `--sidebar-primary-foreground` / `--destructive-foreground` | `#FFFFFF`    |                                                                                                   |
| `--foreground` / `--card-foreground` / `--popover-foreground`                                                               | `#0F172A`    |                                                                                                   |
| `--muted` / `--sidebar-border`                                                                                              | `#F1F5F9`    | slate-100 as both sunken fill and hairline                                                        |

One with **no stated purpose**, worth a decision:

- **`--success-foreground` / `--warning-foreground`** both `#0F172A`, identical to `--foreground`.
  They exist to complete the four-semantic quad, but nothing distinguishes them from `--foreground`
  today. If both stay dark ink, they could alias `var(--foreground)` instead of restating the hex.

---

## Unused tokens

Defined in the app, referenced nowhere in the design or in `treatments.md`:

| Token                                               | Status                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--sidebar-primary`, `--sidebar-primary-foreground` | Design _declares_ them (org avatar tile, count pills, sidebar CTA) but **`radix-nova`'s `sidebar.tsx` reads them 0 times**. Inert until a custom sidebar is built. |
| `--radius-3xl`, `--radius-4xl`                      | Starter-derived steps; design is silent. `--radius-4xl` is live via `badge.tsx`'s `rounded-4xl`.                                                                   |
| `--font-heading`                                    | Starter alias of `--font-sans`; design uses one family throughout. Harmless.                                                                                       |
| `--info-foreground`                                 | Added to complete the quad; no consumer yet.                                                                                                                       |
| `--chart-muted`                                     | Correct and needed, but no chart is built yet.                                                                                                                     |

Nothing here is a defect — but `--sidebar-primary` is worth remembering, because it will look
"already handled" when the sidebar is built and silently isn't.

---

## Visual differences

From `verification/token-board--*.jpg` against `design-reference/design-system--light--part01…04.png`.
Cause is attributed to exactly one of **token** / **treatment** / **component-internal**.

| #   | Location                                  | What differs                                                                                                                                                                                                                                                  | Cause                                                           |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| V1  | Section A, all colour swatches            | **Nothing.** Brand ramp, slate ramp, status triples and special surfaces are indistinguishable from the reference Color section.                                                                                                                              | —                                                               |
| V2  | Section B, Button `destructive`           | Design: solid `#DC2626` with white label. App: pale pink `bg-destructive/10` with red text.                                                                                                                                                                   | **component-internal** (`button.tsx`, blocker B2)               |
| V3  | Section B, Button `secondary`             | Design: white with `--input` border. App: filled slate-100.                                                                                                                                                                                                   | **component-internal** (B1)                                     |
| V4  | Section B, all Button sizes               | Design: `h-11 md:h-8 / h-11 md:h-10 / h-12`, 44px mobile floor. App: `h-6/h-7/h-8/h-9`, no floor. Visibly ~40% shorter than the reference's buttons.                                                                                                          | **component-internal** (B3)                                     |
| V5  | Section B, Badge stock variants           | Design: pill with soft surface + strong text + 25% inset ring. App: shape-only variants, no ring, alpha-soft destructive. The four _status subtle_ rows below render correctly — proving the tokens are right and only the component is missing the tone API. | **component-internal** (B6)                                     |
| V6  | Section B, Tabs                           | Design: 34px pills, active = 1px brand border + brand-soft fill. App: stock segmented `TabsList`.                                                                                                                                                             | **component-internal**                                          |
| V7  | Section B, Input                          | Design: `h-11 md:h-10`, 6px radius. App: `h-8`, 10px radius.                                                                                                                                                                                                  | **component-internal** (B8)                                     |
| V8  | Section B, DropdownMenu open              | **Matches.** Checked items render brand-soft with brand ink — identical to the reference's column picker. This is the trap-1 exhibit and it confirms the literal `--accent` mapping.                                                                          | —                                                               |
| V9  | Body copy throughout                      | Slightly tighter than the reference's prose.                                                                                                                                                                                                                  | **token** — the `text-sm` line-height gap (22.4px → 20px)       |
| V10 | All mono strings (IDs, hexes, rgb values) | ~~Rendering in the system monospace~~ — **fixed in run 2.** Now JetBrains Mono, confirmed by the dotted zero in `$1,740.00` / `103.21.44.9`.                                                                                                                  | resolved                                                        |
| V11 | Dark theme, everywhere                    | No reference exists to differ _from_.                                                                                                                                                                                                                         | n/a — unscored                                                  |
| V12 | Dark theme, Button `link` variant         | Label is `--primary` `#166534` on a slate-950 canvas — **1.9:1**, effectively unreadable. Visible in `token-board--dark--06-buttons.jpg`. Same root cause as D-dark-1: `--primary` does not lighten in dark.                                                  | **token** — but a _dark_ token, which no design baseline covers |

**Every Section B difference is component-internal.** Not one traces to a wrong token value. That
is the separation the two-section layout was built to prove, and it holds.

---

## Recommendations

**Blocking — the only thing between here and component work is four signatures.**

1. **E1–E3, typography line-height.** Sign off in `docs/tokens.md` §9. The alternative — setting
   `--text-2xl`, `--text-xl`, `--text-sm` line-heights — is **forbidden by the current
   constraints** and would re-lead every `text-sm` string in every primitive to fix the leading of
   prose. Components compensate per role: `leading-[1.2]`, `leading-[1.3]`, `leading-[1.6]`.
   _(Note `leading-relaxed` is 1.625, not 1.6 — 0.35px off. Use the arbitrary value.)_
2. **E4, `rounded-full`.** Sign off. `999px` and `calc(infinity*1px)` render identically below
   ~2000px; the design writes `999px` only because its bundle predates the Tailwind v4 utility.

~~3. `--font-mono` face.~~ **Done in run 2.**

**Non-blocking:**

3. Add the nine _Missing tokens_ as named additions, or accept that components will carry literal
   hexes and relax adherence rule #1. `#475569` (body copy) and `#F0FDF4` (row hover) are the two
   that will otherwise get mis-substituted.
4. Alias `--success-foreground` / `--warning-foreground` to `var(--foreground)` if both stay dark
   ink, rather than restating `#0F172A`.
5. **Decide dark's status.** Two concrete defects are now visible in it (D-dark-1 and V12), both
   from `--primary` not lightening. Neither is checkable against a design baseline. See _Risk_.

---

## Risk assessment

What breaks downstream if shipped as-is.

| Risk                                                                      | Severity   | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dark theme is unverifiable, and now demonstrably broken in two places** | **High**   | The design declares no dark theme; dark values come from `react/app/globals.css`. Zero of 286 reference captures are dark. `--primary` does not lighten in dark, which produces **two measured failures**: D-dark-1, the source's `--primary-foreground: slate-900` on `#166534` at **2.50:1** (held at `#ffffff`, 7.13:1 — our override, no baseline); and V12, the `link` button label at **1.9:1** on the dark canvas, still broken. Both are one decision: does `--primary` get a dark-theme value? Nothing in the design can answer it. |
| ~~Mono face missing~~                                                     | ~~High~~   | **Resolved in run 2.** JetBrains Mono self-hosted via `next/font`, and the `globals.css:35` literal that would have shadowed it removed. Verified in the render, not assumed.                                                                                                                                                                                                                                                                                                                                                                |
| **Component layer is 10 blockers deep**                                   | **High**   | B1–B10 in `treatments.md`. Buttons are the worst: wrong secondary shape, wrong destructive treatment, and **no 44px mobile touch floor** — that last one is an accessibility regression on every screen at `< md:`, not a cosmetic gap.                                                                                                                                                                                                                                                                                                      |
| **Body-copy contrast**                                                    | **Medium** | The design's prose colour `#475569` (7.6:1) has no token. If an author reaches for `--muted-foreground` instead, prose drops to 4.8:1 — still AA, but the design's own a11y table calls slate-500 "at the limit" on canvas.                                                                                                                                                                                                                                                                                                                  |
| **Row hover vs row selected**                                             | **Medium** | Both are greens one step apart (`#F0FDF4` vs `#DCFCE7`) and only one has a token. Substituting `--accent` for hover makes every hovered row look selected — directly breaking the queue's primary interaction.                                                                                                                                                                                                                                                                                                                               |
| **`--sidebar-primary` looks handled**                                     | **Low**    | Correct value, zero consumers. Will read as done during sidebar work and isn't.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Line-height**                                                           | **Low**    | Prose is 2.4px tighter per line than designed. Visible in long body copy, harmless in UI strings.                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Gate result: still not met — but for one reason only.** Colour is 100% with no exceptions.
Shadow, spacing and other are 100%. Radius and typography sit below 100% purely on E1–E4, all
four documented in `docs/tokens.md` §9 with an empty signature column. There is no longer any
outstanding _defect_ — only four accepted differences awaiting a signature.

**Sign E1–E4 and the gate is met.** Component work then starts against `treatments.md` §8
blockers B1–B10, with the dark-theme decision (Recommendation 5) taken in parallel since it
gates nothing in light.
