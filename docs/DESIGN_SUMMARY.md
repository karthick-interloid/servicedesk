# Design Summary — ServiceDeskpro

## Source of truth

|                         |                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **Project UUID**        | `c078da5b-9b87-4fe2-94a8-8410a9ca2f16`                                                      |
| **Project name**        | Interloid ServiceDesk Design system                                                         |
| **Pages in project**    | 3 `.dc.html` pages (+ `HANDOFF.md`, a `react/` reference port, and the `_ds/` token bundle) |
| **Canonical prototype** | `Update design.dc.html` — 30 screens                                                        |
| **Canonical tokens**    | `Design System.dc.html` — 28 sections                                                       |
| **Superseded**          | `ServiceDesk Pro.dc.html` — older revision of the same 30 screens; do not build from it     |

**Pinned rule — this UUID only.** Address the project by `c078da5b-9b87-4fe2-94a8-8410a9ca2f16`
and nothing else. The account holds look-alikes that are _not_ this project and must never be
substituted, even if a name matches more closely:

- `5e926efd-1338-4dad-88dc-407a54c479d2` — "Interloid ServiceDesk"
- `5580dd5a-690a-4a61-aa9e-87be847a55db` — "Interloid Design System"
- `8f1502f5-7ea6-4398-93b2-7aff30096b51` — "Interloid Workforce design system"
- `b110fc85-…`, `379ef666-…`, `81dcf920-…`, `0577ed7d-…` — Workforce variants
- `72742fc1-56e7-459e-b3ee-102cf3b61b7d` — "Interloid Starter UI"

If a session cannot resolve the UUID above, it stops. It does not pick the nearest name.

**Dark theme is out of scope for this phase.** The design has no dark mode: zero dark CSS rules
across all three pages, `_ds/…/tokens/dark.css` is never linked and covers only the Interloid
bundle's own variable names (not the shadcn contract), and ~80% of elements (2049 of 2541) carry
hardcoded inline hex. Absent `--dark` references are expected, not gaps.

## Ground truth

Captured to `design-reference/` (untracked, 286 PNGs, 41 MB). Every page in the project has a
capture.

| Capture set                                            | Files | Contents                                                                                     |
| ------------------------------------------------------ | ----- | -------------------------------------------------------------------------------------------- |
| `design-reference/*.png`                               | 55    | All 30 canonical screens × every distinct state, full-page at 1440px                         |
| `design-reference/responsive/`                         | 181   | All 30 screens × 6 designed viewports (375 / 768 / 1280 / 1440 / 1920 / 2560) + a 1024 probe |
| `design-reference/design-system--light--part01…04.png` | 4     | The 26,733px design-system page, sliced at 8000px                                            |
| `design-reference/_superseded-servicedesk-pro/`        | 50    | Older prototype, retained for diffing only                                                   |
| `design-reference/_capture-report.json`                | 1     | Per-screen states, regions, measured treatments, responsive metrics                          |

Naming: `<screen>--light.png`, `<screen>--<state>--light.png`,
`responsive/<screen>--<viewport>-<width>--light.png`.

### Flagged: designed surfaces with no capture

These exist in the design but the prototype harness (Role / Screen / Viewport / State) cannot
reach them — they need in-screen clicks. **No image acceptance criteria exist for them yet.**

1. Import tickets — steps 2 (map columns) and 3 (review); only step 1 is reachable
2. Onboarding wizard — steps 2 and 3; only step 1 is reachable
3. SLA policy editor — the `new` (create) variant; only the edit variant is reachable
4. Seven dialogs — invite member, update payment method, profile settings, keyboard shortcuts,
   new macro, merge ticket, split ticket
5. Global top-bar search results panel (tickets + people + invoices)
6. Column show/hide dropdown in its open state
7. Notification tray and avatar menu in their open states

## Screen inventory

Complexity: **S** = single card / one form · **M** = standard page, one or two panels ·
**L** = multi-panel, heavy grid, charts, or multi-step.

Breakpoints: **full ladder** = 375 cards → 768 table (5 tracks) → 1024 sidebar permanent →
1280 all 8 tracks → 1800 sidebar 288 + cap 2040. **simple** = single column reflow only.

| Page                | Route it implies         | Cx  | States designed                | Breakpoints                    |
| ------------------- | ------------------------ | --- | ------------------------------ | ------------------------------ |
| Log in              | `/login`                 | S   | default, error                 | simple, cap 440                |
| Forgot password     | `/forgot-password`       | S   | default, error                 | simple, cap 440                |
| Create organization | `/signup`                | S   | default, error                 | simple, cap 440                |
| Onboarding wizard   | `/onboarding`            | L   | default (step 1 only)          | simple, cap 620                |
| Ticket queue        | `/tickets`               | L   | default, loading, empty, error | full ladder ⚠ broken 1024–1279 |
| Ticket detail       | `/tickets/[id]`          | L   | default, loading               | full ladder                    |
| New ticket          | `/tickets/new`           | M   | default, error                 | full ladder                    |
| Saved views         | `/views`                 | M   | default                        | full ladder                    |
| Customers           | `/customers`             | M   | default, empty                 | full ladder                    |
| Customer record     | `/customers/[id]`        | M   | default                        | full ladder                    |
| Knowledge base      | `/kb`                    | M   | default, empty                 | full ladder                    |
| Macros & templates  | `/macros`                | M   | default                        | full ladder                    |
| Import tickets      | `/tickets/import`        | L   | default (step 1 only)          | full ladder                    |
| Reports             | `/reports`               | L   | default, loading               | full ladder                    |
| SLA policies        | `/settings/sla`          | M   | default, empty                 | full ladder                    |
| SLA policy editor   | `/settings/sla/[id]`     | L   | default (edit only)            | full ladder                    |
| Team & roles        | `/settings/team`         | L   | default, loading               | full ladder                    |
| Branding            | `/settings/branding`     | M   | default                        | full ladder                    |
| Channels & email    | `/settings/channels`     | M   | default                        | full ladder                    |
| Integrations & API  | `/settings/integrations` | M   | default                        | full ladder                    |
| Security & SSO      | `/settings/security`     | M   | default                        | full ladder                    |
| Data & privacy      | `/settings/data`         | M   | default                        | full ladder                    |
| Audit log           | `/settings/audit`        | M   | default, loading, empty        | full ladder                    |
| Notification center | `/notifications`         | M   | default, empty                 | full ladder                    |
| Plans & pricing     | `/billing/plans`         | L   | default                        | full ladder                    |
| Billing overview    | `/billing`               | L   | default, loading, error        | full ladder                    |
| My requests         | `/portal`                | M   | default, empty                 | simple, cap 1336/1240          |
| Help centre         | `/portal/help`           | S   | default                        | simple, cap 1336/1240          |
| Submit a request    | `/portal/new`            | S   | default, error                 | simple, cap 1336/1240          |
| Request detail      | `/portal/[id]`           | M   | default                        | simple, cap 1336/1240          |

Measured layout constants: sidebar **272** sheet below 1024 · **252** at 1024–1799 · **288** at
≥1800. Content cap **2040** centred, engaging at 1800. Top bar **56**.

## Design-system page

`Design System.dc.html` — 2343 lines, 28 anchored sections, laid out as a 184px sticky nav plus
content column capped at 1240px.

**Token categories**

| Category               | Count | Notes                                                                                                                                                                                             |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn contract tokens | 18    | `--background/foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--chart-1…5`, 5 `--sidebar-*` |
| Added variables        | 39    | 6 semantic groups (`--success`, `--warning`, `--info`, `--destructive-soft/-strong`, `--note`, `--chart-muted`) + a 33-name Interloid bundle bridge                                               |
| Added breakpoints      | 1     | `--breakpoint-wide: 1800px`; `sm…2xl` keep stock widths                                                                                                                                           |
| Radius steps           | 6     | Derived from `--radius: 0.625rem` — sm 6 · md 8 · lg 10 · xl 14 · 2xl 16 · full                                                                                                                   |
| Type steps             | 7     | `text-xs` (floor) → `text-2xl`, plus `font-mono`                                                                                                                                                  |
| Elevation steps        | 4     | Tailwind `shadow-xs / sm / lg / xl`, assigned by role                                                                                                                                             |
| Breakpoints documented | 7     | base · sm · md · lg · xl · 2xl · wide                                                                                                                                                             |

**Component specimens shown** — 15 sections: Buttons · Badges & tags · Form controls · Cards ·
Alerts & banners · Skeletons · Loaders & progress · Navigation · Data display · Feedback & states ·
Icons · Overlays · Advanced inputs · Table anatomy · Charts. Plus 2 pattern sections (Layout &
app shell, Roles & gating) and 5 guidance sections (Content & formatting, Accessibility,
Do & don't, Component API, Custom variables) and a Next.js handoff section.

**States specified** — button default/hover/active/loading/disabled; input rest/focus/error/
disabled/read-only; checkbox rest/checked/indeterminate/disabled; nav item idle/hover/active/
"soon"; table row rest/hover/selected; plan card rest/selected; dropzone rest/drag-over;
skeleton pulse; all five alert tones; list-screen default/loading/empty/error.

**States absent** — focus-visible treatment for table rows, cards, and tabs; keyboard traversal
inside the queue grid; hover on tags (only `selected`/`removable` props are named); error state
for `Select` and `Textarea` (only `Input` is shown); disabled state for buttons in `ghost` and
`destructive` variants; chart interaction beyond the tooltip; toast variants beyond the single
inverse style.

## Treatments census

Values below are lifted from the design-system page's own declarations and confirmed against
computed styles in the canonical prototype.

**Card recipe** — `background: var(--card)` #FFFFFF · `border: 1px solid var(--border)` #E2E8F0 ·
`border-radius` 14px panels / 16px plan cards · `box-shadow: 0 1px 2px 0 rgb(0 0 0 / .05)`
(`shadow-xs`) at rest. Elevation appears **only** on hover or selection — hover raises one step
and shifts up 1px. Padding 16 (`gap-4`) mobile → 24 (`p-6`) desktop. Selected plan card is a
1px brand border plus a 3px brand-soft ring, never a fill.

**Badge recipe** — soft surface + strong text + 25% inset ring, `border-radius: 9999px`,
height 19–20px, `text-xs`. Measured pairs:

| Tone                           | Surface   | Text      | Dot                         |
| ------------------------------ | --------- | --------- | --------------------------- |
| error (Urgent, Breached)       | `#FEF2F2` | `#B91C1C` | status/SLA yes, priority no |
| warning (High, Pending)        | `#FFFBEB` | `#B45309` | "                           |
| info (Normal, Open)            | `#EEF2FF` | `#3730A3` | "                           |
| success (SLA on track, Solved) | `#E4F6EC` | `#0B7A3B` | "                           |
| accent/brand (New)             | `#DCFCE7` | `#166534` | yes                         |
| neutral (Low)                  | `#F1F5F9` | `#334155` | no                          |
| unassigned                     | `#E2E8F0` | `#475569` | no                          |
| unread count                   | `#DC2626` | `#FFFFFF` | n/a, `text-[10px]`          |

Dot rule: present when the badge answers _what state is this in_ (status, SLA, health), absent
when it answers _what kind is this_ (priority, plan, category). Verified across every screen.

**Table row states** — rest `--card` white; hover `green-50` (a 2% brand tint); selected
`--accent` `#DCFCE7`. Separators are `slate-100` hairlines, **never zebra striping**. Header is
a sunken band, sticky beneath the filter bar. Row height 44 desktop / 52 mobile. Layout is CSS
grid, not table layout, so tracks drop by breakpoint — but semantics stay real `th` with `scope`
and `aria-sort`. Desktop track list (measured at ≥1280):
`40px 74px <flex> 158px 92px 150px 104px 128px`.

**Form field metrics** — `height: 44px` below `md:`, `40px` above (`h-11 md:h-10`);
`border-radius: 6px` (`rounded-sm`); `border: 1px solid var(--input)` `#CBD5E1`; focus is
`border-ring` + `ring-ring/30` at 3px. Textarea measured 132px. Label sits above; hint sits
below in `--muted-foreground` and is **replaced, not joined**, by the error message. Search
field is 36px with a leading icon and a `/` key hint. Row checkbox is 20px with brand fill when
selected.

**Focus indicator** — two parts, both required: a 1–2px solid `border-ring` carrying the 3:1
non-text contrast for SC 1.4.11 (3.3:1 on white), plus a 3px `ring-ring/30` halo as a secondary
cue (1.4:1). Restyle only; never remove either.

**Motion** — `duration-200 ease-out` for colour/background/border; `scale .98` press feedback
with no bounce; skeleton pulse `.45 → 1 → .45` over 1.3s; a deliberate 550ms loading flash on
route change; toast lifetime 3200ms; mobile sheet uses Radix's own transition (~220ms).

**Touch targets** — 44px floor below `sm:`, 36px minimum above `md:`. Every button variant
floors at 44px below `md:` (`h-11 md:h-8` / `h-11 md:h-10` / `h-12`).

## Interaction coverage

The design specifies the states listed under _States specified_ above. Everything else is
**undefined, not missing**.

**Undefined states inherit shadcn/Radix accessible defaults and must not be invented.** If the
design does not show a focus ring on a table row, the correct implementation is shadcn's stock
`focus-visible` treatment — not a bespoke one designed in this repo. Concretely, the following
are inherited rather than designed, and no session should author custom behaviour for them:

- Focus-visible rings on rows, cards, tabs, and accordion triggers
- Keyboard traversal and roving tabindex inside menus, comboboxes, and the queue grid
- Focus trapping and restore-to-trigger in dialogs, sheets, and popovers
- `aria-*` wiring for sort, expand/collapse, invalid, and busy
- Scroll locking behind overlays
- `prefers-reduced-motion` fallbacks beyond the two the design names (skeleton pulse, sheet slide)
- Portal/collision behaviour for tooltips and popovers

The two hard rules the design _does_ impose on interaction: **hide, don't disable** (a capability
a role can never use is absent from the DOM, not greyed), and **never colour alone** (every status
pill pairs tone with text; SLA pills add a dot).

## Ambiguities

Numbered questions. Each needs a decision before the affected component is built.

1. **`New` status tone conflicts three ways.** The design-system Color section shows `Open` on
   accent green; the `lib/badge-tones.ts` snippet declares `New:"neutral", Open:"info"`; the
   canonical prototype renders `New` as accent green `#DCFCE7`/`#166534` and `Open` as info
   indigo. Which is authoritative for `New`?
2. **`Open` tone.** Same conflict: Color section says accent green, code and render say info
   indigo. Confirm indigo.
3. **Queue subject column collapses at 1024–1279px.** Computed grid is
   `40px 74px 0px 158px 92px 150px 104px 128px` — the subject track is zeroed, headers overlap
   into `SUBJEREQUESTER`, no subject text renders in any row, and the SLA column is clipped.
   Isolated to the queue grid; `customers`, `audit`, `views`, `kb`, `team` are unaffected. Which
   tracks should drop in this band — requester and status, matching `md:`?
4. **`--success` is not a stock Tailwind primitive.** The Custom-variables table and the Color
   section both label it `green-600 · 50 · 800`, but `:root` declares `#12A150 / #E4F6EC /
#0B7A3B` with the comment "matches the reference design exactly". Tailwind `green-600` is
   `#16A34A`. This also contradicts the page's own claim that "every colour resolves to a stock
   Tailwind primitive". Use the literals or the primitives?
5. **Card radius declared twice.** The radius ladder says panels are 14px (`rounded-xl`); the
   Component API table says `Card — 12px radius; 16px for plan cards`. Measured render is 14.
6. **Page title size declared twice.** Typography says `text-2xl` 24px; Layout & app shell says
   "Title 22px". Measured render is 24px/700/-0.6px tracking.
7. **Sidebar width.** Documented 256px expanded; measured 252px at 1024–1799. Is 252 intentional
   or drift?
8. **Portal content caps.** The design system names `max-w-[980px]` and `max-w-[1240px]`;
   measured is a 1336px outer band with a 1240px inner column (1076 below 1800). 980 never
   appears. What is the real ladder?
9. **Queue track count.** The design system describes "six fixed tracks"; the render has eight —
   requester and status are additional. Are those two optional columns that happen to default on?
10. **"43 screens" vs 30.** The design-system header claims 43 ServiceDesk Pro screens; the
    harness and `HANDOFF.md` both have 30. Is a 13-screen set missing, or is the number stale?
11. **`HANDOFF.md` is stale.** It still documents the pre-green brand (`--primary: 217 58% 43%`
    / `#2E5AAC`) and a conflicting radius note. Should it be treated as retired in favour of
    `Design System.dc.html`?
12. **Duplicate-audit prose is corrupted.** The `--primary vs --success-strong` row reads
    "…rather than reusing the primary ramp. l size, so the system carries one green…" — a
    mid-sentence splice. What was the intended text?
13. **Unreachable flows have no spec.** Import steps 2–3, onboarding steps 2–3, the SLA editor
    create variant, and seven dialogs are described in prose but have no capturable design. Are
    they designed elsewhere, or to be composed from the primitives?
14. **`_ds/…/tokens/dark.css` exists but is unlinked** and only covers the bundle's own variable
    names. When dark lands in the next phase, does it extend to the shadcn contract, and does the
    inline-hex markup get refactored to tokens first?
