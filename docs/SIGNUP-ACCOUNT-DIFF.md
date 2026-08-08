# Consistency report — `/signup` "Your account"

> ## ⚠ DESIGN-AUTHORED SCREEN — NOT A DESIGN DIFF
>
> **There is no capture and no markup for this screen anywhere in project
> `c078da5b-9b87-4fe2-94a8-8410a9ca2f16`.** Its absence was established in
> `SIGNUP-DIFF.md` §0: the design's `ORG_STEPS` names a step 1 "Your account", but no body
> for it exists in `Update design.dc.html`, and no `create-organization`-style capture was
> ever produced for it.
>
> This screen was therefore **authored**, not transcribed. It cannot be pixel-diffed and no
> image acceptance criteria exist for it. **Acceptance is consistency-based**: every visual
> value is inherited from a screen that IS design-derived, and §A proves each inheritance by
> measurement. §B lists what had no precedent at all.

---

## 0. Flow position and the route move it required

The intended flow is `/signup` → `/create-org` → `/onboarding`, and the create-org card's
own strip advertises itself as **step 2 of 4** — so `/signup` is step 1.

`/signup` was **already occupied** by the fully-built "Create your organization" screen from
the previous phase. The brief described it as "a placeholder … replace it"; it was not a
placeholder, so it was **moved, not discarded**:

| Before                                        | After                                               |
| --------------------------------------------- | --------------------------------------------------- |
| `src/app/(auth)/signup/page.tsx` (create-org) | `src/app/(auth)/create-org/page.tsx`                |
| `features/auth/components/signup-form.tsx`    | `features/auth/components/create-org-form.tsx`      |
| `test/e2e/signup.spec.ts`                     | `test/e2e/create-org.spec.ts`, retargeted           |
| —                                             | `src/app/(auth)/signup/page.tsx` (new, this screen) |

Knock-on links updated: the onboarding wizard's step-1 Back now returns to `/create-org`
rather than `/signup`. `login-form.tsx`'s "Create an organization" link still points at
`/signup`, which is now correct — that is the flow's entry.

`SIGNUP-DIFF.md` documents the create-org screen and still applies to it at its new URL.

**Chain completed 2026-08-07.** create-org's Continue now advances to `/onboarding` on
valid input, so all four steps connect: `/signup` → `/create-org` → `/onboarding` (whose
own steps 3 and 4 are in-page). `SIGNUP-DIFF.md` §D was updated to match, and
`test/e2e/signup-flow.spec.ts` walks the whole chain.

Note the deliberate consequence: create-org's seeded portal address is simulated as
**taken**, so its default state cannot advance — a free address has to be chosen first.
That is what keeps the design's "That address is taken." error state reachable.

---

## A. Inherited values — provenance and proof

Nothing below was chosen; each was copied from an existing screen and then measured on this
one. Build numbers are DOM measurements from
`verification/signup-account--measurements.json`.

| Value                 | Inherited from                             | Source measurement                                            | This screen                                                           |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Card width            | login + create-org (`authCard`)            | 440px                                                         | **440px** ✓                                                           |
| Card radius           | login + create-org                         | 16px                                                          | **16px** ✓                                                            |
| Card padding          | login + create-org                         | 32px (24/20 below md)                                         | **32px**, `24px 20px` at 375 ✓                                        |
| Card block gap        | login + create-org                         | 18px                                                          | **18px** ✓                                                            |
| Card shadow           | login + create-org                         | `0 10px 30px rgba(15,23,42,.06)`                              | identical string ✓                                                    |
| Page container        | login + create-org (`authPad`)             | centred column, 22px gap, 56/24 → 28/20 padding               | identical ✓                                                           |
| Logo tile + wordmark  | login + create-org                         | 34px tile, 8px radius, `--brand-accent`, 18px/700 wordmark    | identical ✓                                                           |
| Progress strip        | create-org (`SignupStepper`)               | 26px circles, `#F8FAFC`, 14px radius                          | **26px**, identical ✓                                                 |
| Strip state           | create-org, `currentStep` prop             | step 2 → step 1                                               | circle 1 `#0F766E`, 2–4 `#E2E8F0`; `aria-current` on "Your account" ✓ |
| Eyebrow               | create-org ("STEP 2 OF 4")                 | 12px/700 0.1em caps, brand                                    | "STEP 1 OF 4", identical treatment ✓                                  |
| h1                    | login + create-org                         | 24px/700, −0.025em                                            | identical ✓                                                           |
| Field height          | login + create-org                         | 42px at 1440, 44px floor below md                             | **42px**, 44px at 375 ✓                                               |
| Field radius          | login + create-org                         | 6px                                                           | **6px** ✓                                                             |
| Field border          | login + create-org                         | `--input` `#CBD5E1`                                           | **`#CBD5E1`** ✓                                                       |
| Label treatment       | login + create-org                         | 14px semibold, above the field                                | identical ✓                                                           |
| Hint treatment        | login + create-org                         | 14px `--muted-foreground`, below                              | identical ✓                                                           |
| Error treatment       | login + create-org                         | `text-destructive-strong`, **replaces** the hint              | identical ✓                                                           |
| Invalid field ring    | login + create-org                         | `aria-invalid` → `border-destructive` + `ring-destructive/20` | identical ✓                                                           |
| CTA geometry          | **create-org**, not login                  | 114×52, **left-aligned**, auto-width                          | **114×52**, left-aligned ✓                                            |
| CTA fill              | login + create-org                         | `--brand-accent` `#0F766E`                                    | **`#0F766E`** ✓                                                       |
| Footer link treatment | login ("New here? Create an organization") | 14px muted + brand semibold link                              | identical ✓                                                           |

**The stepper was parameterized, not duplicated.** `SignupStepper` already took a
`currentStep` prop, so this screen passes `currentStep={1}` and shares one component with
create-org. No shared code was edited.

**The password field keeps the plain fields' metrics.** `InputGroup` supplies the bordered
wrapper so the reveal toggle sits _inside_ the field; measured 42px tall, 6px radius,
`#CBD5E1` border — identical to the plain email input beside it. Its `h-8` and `rounded-lg`
are plain classes, so they merge away without an important modifier (unlike
`SelectTrigger` and `Toggle` — see `SIGNUP-DIFF.md` §C and `ONBOARDING-DIFF.md` §C).

## B. Authored with no precedent

| #   | Decision                                                        | Reasoning                                                                                                                                                                          |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | **Heading "Create your account"**                               | Parallel to create-org's "Create your organization". `ORG_STEPS` calls the step "Your account", which is used as the stepper label; the h1 needs a verb.                           |
| N2  | **Sub-line "This is the login you'll use to work your queue."** | Mirrors login's "Work your queue against live SLA targets." — same voice, same length band.                                                                                        |
| N3  | **CTA label "Continue"**, not "Create account"                  | Chosen deliberately: nothing is created here, and every other step in this flow advances with "Continue". "Create account" would promise provisioning that does not happen.        |
| N4  | **Three fields: email, password, confirm**                      | The brief's set. No precedent existed for which fields an account step carries.                                                                                                    |
| N5  | **8-character minimum**, stated in the hint                     | The brief's default. The hint reads "At least 8 characters." and the error reads "Use at least 8 characters" — copy and rule are generated from one constant so they cannot drift. |
| N6  | **Email hint copy**                                             | "Use your work address — invites and alerts go here." Authored; no design hint exists for an email field on any auth screen.                                                       |
| N7  | **Reveal toggle as an `InputGroupButton`**                      | No password-reveal control exists anywhere in the design. Built from installed primitives — `lucide` Eye/EyeOff, `ui/input-group.tsx`. No new package.                             |
| N8  | **`aria-pressed` on the reveal toggle**                         | It is a two-state control; the label also flips between "Show password" and "Hide password", so state never rides on the icon alone.                                               |
| N9  | **"Already have an account? Log in"**                           | The reciprocal of login's "New here? Create an organization", with the same treatment.                                                                                             |

**Not authored:** no new colour, spacing, radius, shadow, font size or weight. Every metric
in §A came from an existing screen; §B is copy, field selection and one composed control.

## C. The walk — verified in the production build

Driven through the UI; transcript in `verification/signup-account--measurements.json` →
`walk`.

| Step | Action                                           | Result                                                                                                                                          |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Continue with everything empty                   | Three field errors — "Enter your email address", "Enter a password", "Re-enter your password". **All hints gone.** URL stays `/signup`.         |
| 2    | `nope` + `short` / `short`                       | Email → "Enter a valid email address"; password → "Use at least 8 characters"; **confirm keeps its hint** (it matched). Errors are independent. |
| 3    | `ada@acme.io` + `correct-horse` / `correcthorse` | **Only** "Passwords don't match" on the confirm field. Email and password both keep their hints.                                                |
| 4    | Reveal toggle                                    | `type` flips `password` → `text`, value preserved as `correct-horse`.                                                                           |
| 5    | Fix the confirm field, Continue                  | **Navigates to `/create-org`**, which renders "Create your organization".                                                                       |

No account, session, hash or storage is involved at any point — step 5's only effect is
`router.push`.

**Evidence.**

| File                                                           | What                          |
| -------------------------------------------------------------- | ----------------------------- |
| `verification/signup-account--{1440,375}--{light,dark}.png`    | default state                 |
| `verification/signup-account--mismatch--{1440,375}--light.png` | password-mismatch error state |
| `verification/signup-account--measurements.json`               | geometry + walk transcript    |

## D. Deliberately not built

- **Real account creation.** No session, cookie, server action, hashing or persistence.
- **Password-strength meter.** Would need a library the brief forbids; the stated 8-character
  minimum is the whole rule.
- **Email-availability checking.** No registry to query.
- **Social sign-up.** Login carries an inert "Continue with Google"; nothing equivalent was
  authored here, since inventing a second unspecified social affordance is not warranted.

## E. Recommended follow-up (not done — needs sign-off)

**The auth card class string now appears three times** — `login-form.tsx`,
`create-org-form.tsx` and `signup-account-form.tsx` each carry the same
`max-w-[440px] … rounded-2xl border bg-card … shadow-[…]` string. Extracting an `AuthCard`
component (or a shared constant) would give the treatment one home, but it means editing two
already-verified screens, so it was **reported rather than performed**, per the brief. Same
for the `authPad` page container, which is duplicated across all three `(auth)` routes.

Dark renders for this screen, like every other, are semantic-token output only — the design
declares no dark rules.
