# Difference list — `/onboarding` vs `Update design.dc.html`

Scope: the three-step onboarding wizard. Unauthenticated — `(auth)` route group, no
`(app)` shell chrome.

---

## 0. Verification before building

The brief's premise checked out this time. Confirmed against the design before writing code:

| Check                         | Result                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Step count and labels         | **3** — `Business hours` · `First SLA policy` · `Invite your team`, from `wizSteps`    |
| Real step state               | **Yes.** `s.wizard` drives `wizIs1`/`wizIs2`/`wizIs3` bodies and every stepper style   |
| Stepper navigable             | **Yes.** Each entry is `<button onClick={w.go}>` — not a static strip like `/signup`'s |
| Back control                  | **Yes.** `wizBack: () => set({ wizard: Math.max(1, s.wizard - 1) })`                   |
| All three step bodies present | **Yes — none label-only.** Each `<sc-if wizIs*>` carries a full field set              |

Contrast with `/signup`, whose strip hardcodes `x.n <= 2` against no state. This one is a
genuine wizard.

### ⚠ Capture availability — the brief's claim did not hold

The brief said "reference captures provided show all three steps". **No images were
attached, and only one onboarding capture exists in the repo**:
`design-reference/onboarding-wizard--light.png` (plus its responsive variants), which shows
**step 1 only**. `DESIGN_SUMMARY.md`'s "steps 2–3 no-capture" is therefore **not**
superseded — it still stands.

This did not block the build: the STOP condition was about _markup_, and all three bodies
are fully specified in the design. Steps 2 and 3 are built from markup and are diffed
against it, not against an image. See §F.

---

**Ground truth.** `Update design.dc.html` (etag `1786086606842887`) → `scrOnboarding`,
`wizCard`, `wizSteps`, `wizNext`/`wizBack`/`wizNextLabel`, `days`, `priRows`, `TIMEZONES`;
and `design-reference/onboarding-wizard--light.png`, **1:1 at 1440** (the card measures
exactly its 620px `max-width`).

**Evidence.** Production build, Chromium, `deviceScaleFactor: 1`, animations frozen.

| File                                                                 | What                           |
| -------------------------------------------------------------------- | ------------------------------ |
| `verification/onboarding--step{1,2,3}--{1440,375}--{light,dark}.png` | all three steps, 12 files      |
| `verification/onboarding--measurements.json`                         | DOM geometry + walk transcript |
| `verification/crops/onboarding-step1.png`                            | design crop — step 1 body      |
| `verification/crops/onboarding-footer.png`                           | design crop — footer           |

## A. Verified as matching

| Property                    | Design                                                                                                           | Build                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Card width                  | **620px** (`wizCard`) — wider than login/signup's 440                                                            | 620px ✓                                     |
| Card radius / padding / gap | 16px · 30px · 20px                                                                                               | identical ✓                                 |
| Card height, step 1         | 566px (y 270–835)                                                                                                | 577px ✓ (+11px)                             |
| Card, below md              | 100% width, `22px 18px` padding                                                                                  | 335px at 375, `22px 18px` ✓                 |
| Stepper strip               | 58px, 14px radius, `#F8FAFC`, 14px pad/gap                                                                       | 558×62, `#F8FAFC` ✓                         |
| Step circles                | 28px, 12px/700 numeral                                                                                           | 28px ✓                                      |
| Circle fill, reached        | brand accent + white numeral                                                                                     | `#0F766E` ✓                                 |
| Circle fill, upcoming       | `#E2E8F0` + `#64748B` numeral                                                                                    | identical ✓                                 |
| Step labels                 | 14px; current 700 dark, others 500 muted                                                                         | identical ✓                                 |
| Eyebrow                     | `SET UP <ORG>` 12px/700 0.1em caps, brand                                                                        | identical ✓                                 |
| h1 / h2                     | 24px/700 −0.025em · 18px/600                                                                                     | identical ✓                                 |
| Working-day pills           | 52×36, 8px radius, 14px/600                                                                                      | 52×36 ✓                                     |
| Day pill, selected          | teal border + tinted fill + teal ink                                                                             | `#0F766E` border, `#E7F1F1` fill ✓ (see O2) |
| Day pill, unselected        | `#E2E8F0` border, white fill, muted ink                                                                          | identical ✓                                 |
| Time-zone hint              | `UTC +05:30 · Mumbai · Bengaluru · Chennai`                                                                      | identical, and live ✓                       |
| Day starts / ends           | `09:00` / `18:30`, two columns at lg                                                                             | identical ✓                                 |
| Selects                     | 42px                                                                                                             | 42px ✓ (see §C)                             |
| SLA rows                    | 4 — Urgent/High/Normal/Low, read-only                                                                            | 4, read-only ✓                              |
| SLA values                  | 15 minutes/4 hours · 1 hour/8 business hours · 4 business hours/2 business days · 1 business day/5 business days | identical ✓                                 |
| Step 3 fields               | seeded emails + "Separate with commas" + role select (Agent)                                                     | identical ✓                                 |
| Footer, every step          | Back · Skip for now · Continue, 42px                                                                             | identical ✓                                 |
| Footer, step 3 primary      | "Finish setup" (`wizNextLabel`)                                                                                  | identical ✓                                 |
| Shell chrome                | none                                                                                                             | 0 sidebars, 0 headers ✓                     |

**The footer is unconditional in the design** — `wizBack`, `finishOnboarding` and `wizNext`
are all rendered on every step with no `sc-if`. Confirmed against the step-1 capture crop.
No hide-don't-disable case arises _within_ the wizard; see O1 for step 1's Back.

**SLA targets are read-only**, as asked: the `wizIs2` body contains no input, select or
editable control of any kind — only a pill and two text values per row. Rendered as shown.

**Priority pills pair tone with text**: each carries its dot _and_ spells out the priority,
and all colour resolves through `lib/badge-tones.ts` rather than a palette class.

## B. Deviations

| #   | Difference                                                                          | Cause          | Detail                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| O1  | **Step 1's Back is a link to `/signup`, not an inert control.**                     | build decision | The design's `wizBack` clamps at 1, making Back a no-op on step 1. In this app `/signup` genuinely precedes `/onboarding`, so Back navigates there rather than sitting dead. Hide-don't-disable never has to fire. |
| O2  | **Selected day fill is `--accent` `#E7F1F1`; the design computes `#ECF4F3`.**       | token          | The design's `shade(accent, .92)` lands one step lighter than `--accent` (`shade(accent, .9)`). No token carries `#ECF4F3`; a literal would not survive dark. Δ ≈ 5/3/2 per channel — imperceptible.               |
| O3  | **Day-start / day-end are text inputs, not `type="time"`.**                         | design         | The design renders plain text fields showing `09:00`. A native time picker would change the control's appearance and add AM/PM chrome. Validated as 24-hour `HH:MM` instead.                                       |
| O4  | **Step-1 card is 11px taller than the capture.**                                    | text metrics   | Accumulated line-height across the eyebrow, h1, h2 and three field groups. No single element differs.                                                                                                              |
| O5  | **Emails and role are pre-filled** (`priya@northwind.io, sam@northwind.io`, Agent). | design         | Both are the design's seeded values and appear in its markup. Kept so the render matches. Delete the seeds when provisioning lands.                                                                                |

## C. Primitive constraints worked around

Both are carried forward from earlier phases; **no `ui/` file was edited**.

1. **`SelectTrigger` forces its own height** via `data-[size=default]:h-8` — an
   attribute-qualified rule that outranks a plain height class. Both selects here (time
   zone, invite role) use `h-11! md:h-10.5!` to reach the design's 42px, exactly as
   `/signup` does. Measured 42px on both. Same defect class as `SIGNUP-DIFF.md` §C.
2. **`Toggle` hardcodes its on-state** as `data-[state=on]:bg-muted` in its base cva
   string. A plain `data-[state=on]:bg-accent` ties on specificity and loses
   unpredictably, so the working-day pills apply their selected border, fill and ink with
   the important modifier. **New this phase** — worth adding to the list if `ui/` is ever
   revised.

No toggle-group primitive was needed: the design's working days are seven **independent**
toggles (`days` maps each to its own element), which `ui/toggle.tsx` covers directly.

## D. The walk — verified in the production build

Driven through the UI; full transcript in `verification/onboarding--measurements.json` →
`walk`.

1. **Step 1**, changed every field: time zone → Japan Standard Time (hint updated live to
   `UTC +09:00 · Tokyo · Seoul`), toggled **Sat** on, day start → `08:15`, end → `17:45`.
2. **Continue → step 2.** Stepper reads "First SLA policy", body reads "Set your first SLA
   targets".
3. **Continue → step 3.** "Invite your team" / "Invite your agents". Changed emails to
   `ada@acme.io, grace@acme.io` and role to **Manager**.
4. **Back → step 2**, **Back → step 1.**
5. **Every step-1 value survived** — time zone, hint, the six selected days including the
   added Sat, and both times. Byte-identical before and after (`step1Persisted: true`).
6. **Forward again to step 3** — emails and role also survived (`step3Persisted: true`).
7. **Validation:** cleared every working day, pressed Continue → stayed on step 1 with
   "Pick at least one working day".
8. **Skip bypassed it:** with validation still failing, "Skip for now" advanced to step 2.
9. **"Finish setup" did not navigate** — URL stayed `/onboarding`.

## E. Deliberately not built

- **Real provisioning.** No account, org, business-hours record, SLA policy, invite or
  session. "Finish setup" `preventDefault`s and stops.
- **Sending invites.** Step 3 collects addresses and a role; nothing is dispatched.
- **Editable SLA targets.** The design has no controls for them (§A).
- **A designed error state.** The `onboarding` route declares `states: ["default"]` — the
  design specifies **no** error state for this screen. The client validation added here is
  the brief's requirement, and its treatment follows the auth convention by extension
  (field-level, error replaces hint) rather than from any capture. Flagged, not assumed.

## F. Image acceptance criteria pending

Only **step 1** has a reference capture. Steps 2 and 3 are built from complete design
markup and diffed against it field-by-field in §A, but **no image exists to accept them
against** — `DESIGN_SUMMARY.md`'s no-capture note for onboarding steps 2–3 still holds.
Dark renders for all three steps are semantic-token output only: the design declares no
dark rules.
