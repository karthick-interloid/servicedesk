# Difference list — `/create-org` vs `Update design.dc.html`

> **Route moved 2026-08-07.** This screen was built at `/signup` and now lives at
> `/create-org`; a design-authored "Your account" step took over `/signup` as step 1 of 4.
> Everything below still describes this screen — only its URL, its component name
> (`CreateOrgForm`) and its spec file (`test/e2e/create-org.spec.ts`) changed. See
> `docs/SIGNUP-ACCOUNT-DIFF.md` §0.

Scope: `/create-org`, default and error states. Unauthenticated — `(auth)` route group,
no `(app)` shell chrome.

---

## 0. Scope correction — this screen is not a wizard

The task brief described `/signup` as a revised **4-step wizard**. It is not, and the design
was not revised. Verified before building:

| Check                              | Result                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `Update design.dc.html` etag       | `1786086606842887`, 321,134 bytes — **unchanged** from earlier reads this session |
| `ROUTES` contains a `signup` entry | **No.** Auth routes are `login`, `forgot`, `create-org`, `onboarding` only        |
| `create-org` declared states       | `["default","error"]` — matching `DESIGN_SUMMARY.md`'s "S · simple, cap 440"      |
| `<sc-if scrCreateOrg>` bodies      | **One.** No step state, no Back control, no conditional step bodies               |

The `scrCreateOrg` block (lines 250–277) is a single `authCard` holding a static progress
strip, a heading block, **three fields** and one Continue button that jumps to the separate
`onboarding` route.

**The four-step strip is a status indicator, not a control.** `orgSteps` hardcodes
`background: x.n <= 2 ? accent : grey` and `fontWeight: x.n === 2 ? 700 : 500` — literal
comparisons against no state. It always renders 1–2 teal and 3–4 grey because it advertises
a flow spanning _routes_ (login → create-org → onboarding), which is also why "Step 2 of 4"
is a fixed string.

### Per-step markup availability

| Step | Label          | Markup in the design                                                        |
| ---- | -------------- | --------------------------------------------------------------------------- |
| 1    | Your account   | **None anywhere in the file.**                                              |
| 2    | Organization   | **Full** — the screen built here.                                           |
| 3    | Business hours | **Label string only** (`ORG_STEPS`). Content exists solely in `onboarding`. |
| 4    | Invite team    | **Label string only.** Same.                                                |

`onboarding` cannot supply steps 3–4 even setting aside that it is out of scope: it is a
**3**-step wizard whose middle step is _First SLA policy_, so the sequences do not align.

Reported before building; **built as the design shows it** on your instruction. No fields
were invented for steps 1, 3 or 4.

---

**Ground truth.** `Update design.dc.html` (etag `1786086606842887`) → `scrCreateOrg`,
`ORG_STEPS`, `orgSteps`, `authCard`, `TIMEZONES`; and
`design-reference/create-organization--light.png` / `--error--light.png`, both **1:1 at
1440** (the card measures exactly its 440px `max-width`).

**Evidence.** Production build, Chromium, `deviceScaleFactor: 1`, animations frozen.

| File                                                       | What                                   |
| ---------------------------------------------------------- | -------------------------------------- |
| `verification/signup--step2--{1440,375}--{light,dark}.png` | default state                          |
| `verification/signup--step2-error--{1440,375}--light.png`  | error state                            |
| `verification/signup--measurements.json`                   | DOM geometry + behaviour transcript    |
| `verification/crops/signup-default-band.png`               | design crop — strip + heading + fields |
| `verification/crops/signup-hints-band.png`                 | design crop — hints + Continue         |
| `verification/crops/signup-error-band.png`                 | design crop — error state              |

The error state is reached **through the UI only** — press Continue on the seeded address.

## A. Verified as matching

| Property                    | Design                                          | Build                                                                      |
| --------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| Card width                  | 440px — **same as login, not wider**            | 440px ✓                                                                    |
| Card radius / padding / gap | 16px · 32px · 18px                              | identical ✓                                                                |
| Card height                 | 645px (y 230–874)                               | 641px ✓ (−4px)                                                             |
| Card, below md              | 100% width, 20px gutter, 24/20 padding          | 335px at 375, `24px 20px` ✓                                                |
| Progress strip              | 90px tall, 14px radius, `#F8FAFC`, 1px border   | 374×90, 14px, `#F8FAFC` ✓                                                  |
| Strip wrap                  | wraps to 2 rows at 440px                        | 2 rows ✓                                                                   |
| Step circles                | 26px, 12px/700 numeral                          | 26px ✓                                                                     |
| Circle fill, steps 1–2      | brand accent, white numeral                     | `#0F766E` on `#FFFFFF` ✓                                                   |
| Circle fill, steps 3–4      | `#E2E8F0`, `#64748B` numeral                    | identical ✓                                                                |
| Label weight                | step 2 bold + dark; all others muted 500        | identical ✓ (step 1 muted despite a filled circle, as the design draws it) |
| "STEP 2 OF 4"               | 12px/700, 0.1em, uppercase, brand accent        | identical ✓                                                                |
| Fields                      | 42px, 6px radius, `#CBD5E1`                     | 42px ✓ (44px floor at 375)                                                 |
| Portal address hint         | `northwind.servicedesk.pro`                     | identical, and live ✓                                                      |
| Time zone hint              | `UTC +05:30 · Mumbai · Bengaluru · Chennai`     | identical ✓                                                                |
| Error, Portal address       | `#DC2626` border + red halo, hint replaced      | identical, via `aria-invalid` ✓                                            |
| Error copy                  | "That address is taken. Try northwind-support." | identical ✓                                                                |
| Other fields in error       | untouched, normal border                        | `#CBD5E1` ✓                                                                |
| Continue button             | 112×52, **left-aligned**, brand fill            | 114×52, left-aligned, `#0F766E` ✓                                          |
| Shell chrome                | none                                            | 0 sidebars, 0 headers ✓                                                    |

**Field metrics needed no reconciliation with login** — both screens measure 42px at 1440
and share the 440px card, so no shared-token decision is required.

**The Continue button is left-aligned and auto-width**, unlike login's full-width CTA. The
design's markup passes `fullBtn` (`width:100%`), but its own render does not honour it; the
capture measures 112px. Screen wins, per the standing rule.

## B. Deviations

| #   | Difference                                                                          | Cause            | Detail                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | **Continue is 114px, the design's is 112px.**                                       | text metrics     | Auto-width from `px-5` plus the label. 2px. Reproducing 112px exactly would need a hardcoded width.                                                                                                                                       |
| S2  | **The time-zone select shows the selected zone; the design shows a mismatch.**      | design defect    | The capture renders `(GMT-08:00) Pacific Time` in the control while its hint reads `UTC +05:30 · Mumbai…` — the design's `default-value` binding and its computed `tzHint` disagree. Bound properly here; the hint follows the selection. |
| S3  | **Org name and portal address are pre-filled** (`Northwind Support` / `northwind`). | design           | The design ships both as `default-value` and the capture renders them. Kept so the screenshots match. Delete the seeds when provisioning lands.                                                                                           |
| S4  | **File is `signup-form.tsx`, not `signup-wizard.tsx`.**                             | scope correction | The brief's filenames presupposed a wizard. `signup-stepper.tsx` is kept as its own component since the strip is a distinct unit; the card is named for what it is.                                                                       |
| S5  | **A "taken" address is simulated against the seeded slug.**                         | no backend       | There is no registry, so `northwind` stands in for a taken address. It is what makes the design's error state reachable through the UI rather than stubbed.                                                                               |

## C. Primitive constraint worked around

**`SelectTrigger` forces its own height.** `ui/select.tsx` carries
`data-[size=default]:h-8` — an attribute-qualified rule that outranks a plain `h-10.5`
class, so the control silently rendered **32px against the design's 42px**. `ui/` is not
ours to edit, so the height is applied with the important modifier (`h-11! md:h-10.5!`).
Measured 42px after the fix. Same class of defect as the sheet-width issue in
`SHELL-DIFF.md` B2 — worth a note if these primitives are ever revised.

## D. Behaviour, as verified

Exercised through the UI; transcript in `verification/signup--measurements.json` →
`behaviour`.

| Action                                  | Result                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| Type `acme-eu` into Portal address      | hint becomes `acme-eu.servicedesk.pro` **live**                 |
| Select Japan Standard Time              | hint becomes `UTC +09:00 · Tokyo · Seoul`                       |
| Clear Organization name, press Continue | "Enter an organization name"; the slug hint survives untouched  |
| `Acme EU!` into Portal address          | "Use lowercase letters, numbers and hyphens only"; hint removed |
| Seeded `northwind`, press Continue      | "That address is taken. Try northwind-support." — stays put     |
| A free address, press Continue          | **advances to `/onboarding`** (chain completed 2026-08-07)      |
| Any blocked Continue                    | URL stays `/create-org` — nothing is ever provisioned           |

Errors are per-field and independent: a name error does not disturb the slug hint, and the
hint is always _replaced_ by its error, never stacked with it.

## E. Deliberately not built

- **Steps 1, 3 and 4.** No field markup exists in the design (§0). Nothing invented.
- **`/onboarding` itself.** Built in its own phase; see `docs/ONBOARDING-DIFF.md`. This
  screen now links into it but owns none of it.
- **Real provisioning.** No account, no org record, no session, no server action. Continue
  `preventDefault`s; on valid input its only side effect is `router.push("/onboarding")` —
  asserted in `test/e2e/create-org.spec.ts` and `test/e2e/signup-flow.spec.ts`.
- **Slug availability checking.** No registry to query; S5 simulates one value.

## F. Image acceptance criteria pending

Only **step 2** has a reference capture. `design-reference/create-organization--light.png`
and `--error--light.png` are the sole images this screen can be diffed against, and both
are covered above. There are no captures for steps 1, 3 or 4 because those screens do not
exist in the design — so no acceptance criteria are pending for them either; they are
**unspecified**, not merely uncaptured. Dark-mode renders are also unverified against any
reference: the design declares no dark rules, so `signup--step2--*--dark.png` show this
build's semantic-token output only.
