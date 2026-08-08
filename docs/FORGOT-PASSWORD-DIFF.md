# Difference list — `/forgot-password` vs `Update design.dc.html`

Scope: the reset-**request** screen and its two in-card states. Unauthenticated —
`(auth)` route group, no `(app)` shell chrome.

---

## 0. Verification before building

| Check                  | Result                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Screen exists          | **Yes** — the `scrForgot` block, lines 221–249                                                                         |
| Route id in the design | **`forgot`** (a prototype state key, not a URL). Built at `/forgot-password`, which `login-form.tsx` already linked to |
| Declared states        | `["default", "error"]` — matching `DESIGN_SUMMARY.md`                                                                  |
| Captures               | `forgot-password--light.png` and `--error--light.png`, both **1:1 at 1440**                                            |

The design puts **two** states in one card, switched by `resetSent` / `resetForm`: the
request form, and a "Check your inbox" confirmation. Its own logic returns to the form
whenever an error is present (`resetForm: !s.resetSent || error`), which is why the error
capture shows the form rather than the confirmation.

## 1. Downstream reset screens — availability, as asked

|         | Screen                                      | In the design?                                                                                                                                                                                           |
| ------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | "Check your email" confirmation             | **PRESENT.** A `resetSent` state inside this same card — 44px check tile, h1 "Check your inbox", body copy, and a secondary "Resend link" button. A trivial in-card state, so **built in this pass**.    |
| **(b)** | Reset-link landing / new password + confirm | **ABSENT.** No such route exists; the design's auth routes are `login`, `forgot`, `create-org`, `onboarding` only. **Authored-territory** — not built, awaiting a decision like the signup account step. |
| **(c)** | Post-reset success                          | **ABSENT.** Same. **Authored-territory** — not built.                                                                                                                                                    |

So the flow the design actually specifies stops at "Check your inbox". Everything a real
reset needs after the user clicks the emailed link is unspecified.

**(a) has no capture.** The harness exposes only `default` and `error` for this route, so
the confirmation is reachable only by clicking. It is built from markup and has **no image
acceptance criteria**; `verification/forgot-password--sent--{1440,375}--light.png` records
what this build renders, not what was approved.

---

**Ground truth.** `Update design.dc.html` (etag `1786086606842887`) → `scrForgot`,
`authCard`, `resetForm`/`resetSent`/`resetError`/`resetErrorMsg`; and
`design-reference/forgot-password--light.png` / `--error--light.png`.

**Evidence.** Production build, Chromium, `deviceScaleFactor: 1`, animations frozen.

| File                                                         | What                                    |
| ------------------------------------------------------------ | --------------------------------------- |
| `verification/forgot-password--{1440,375}--{light,dark}.png` | request form, default                   |
| `verification/forgot-password--error--{1440,375}--light.png` | rate-limit error                        |
| `verification/forgot-password--sent--{1440,375}--light.png`  | "Check your inbox" (no capture to diff) |
| `verification/forgot-password--measurements.json`            | geometry, refactor check, walk          |
| `verification/crops/forgot-default-band.png`                 | design crop — form                      |
| `verification/crops/forgot-error-band.png`                   | design crop — error                     |

## A. Verified as matching

| Property                    | Design                                                                                                                  | Build                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Card width                  | 440px (`authCard`)                                                                                                      | 440px ✓                        |
| Card radius / padding / gap | 16px · 32px · 18px                                                                                                      | identical ✓                    |
| Card height, form           | 335px (y 385–719)                                                                                                       | 337px ✓ (+2px)                 |
| Card height, error          | 467px (y 319–785)                                                                                                       | 474px ✓ (+7px)                 |
| Card, below md              | 100% width, 20px gutter, `24px 20px` padding                                                                            | 335px at 375, `24px 20px` ✓    |
| h1                          | "Reset your password", 24px/700, −0.025em                                                                               | identical ✓                    |
| Body copy                   | "Enter the email you sign in with. We'll send a link that's valid for 30 minutes."                                      | transcribed verbatim ✓         |
| Field                       | "Work email", `type=email`, placeholder `you@northwind.io`, **not** pre-filled                                          | identical ✓                    |
| Field metrics               | 374×42, 6px radius, `#CBD5E1`                                                                                           | 374×42, 6px, `#CBD5E1` ✓       |
| Field, below md             | 44px touch floor                                                                                                        | 44px at 375 ✓                  |
| Submit                      | "Send reset link", **154×52, left-aligned**                                                                             | 159×52, left-aligned ✓         |
| Submit fill                 | brand accent                                                                                                            | `#0F766E` ✓                    |
| Error banner                | `#FEF2F2` fill, `#F5B5B5` border, icon + bold lead, 374 wide                                                            | 374×93, `--destructive-soft` ✓ |
| Banner copy                 | "**We couldn't send that link.** Too many attempts from this address — try again in 60 seconds, or contact your admin." | transcribed verbatim ✓         |
| Field error copy            | "Rate limited"                                                                                                          | identical ✓                    |
| Error structure             | banner **and** field error together                                                                                     | identical ✓                    |
| Confirmation (a)            | 44px tile / 14px radius, h1 "Check your inbox", body, secondary "Resend link"                                           | identical, 325px card ✓        |
| "Back to sign in"           | centred, outside both states                                                                                            | present in both ✓              |
| Shell chrome                | none                                                                                                                    | 0 sidebars, 0 headers ✓        |

**The submit is left-aligned and auto-width.** The markup passes `fullBtn` (`width:100%`),
but the design's own render ignores it — measured 154px in both captures. Same
`fullBtn` non-effect already recorded for create-org. Screen wins.

**The design's error is a rate limit, not a validation failure.** Its copy says "Too many
attempts from this address", and `resetErrorMsg` is literally `"Rate limited"` — so it is
not reachable by typing a bad address.

## B. Deviations

| #   | Difference                                                                | Cause        | Detail                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **The rate limit is simulated by asking twice.**                          | no backend   | There is no send counter to rate-limit against, so the second send in a session trips it — which is what the design's own copy describes. Reaching it any other way would need an invented trigger.                                                            |
| F2  | **Submit is 159px, the design's is 154px.**                               | text metrics | Auto-width from `px-5` plus the label. 5px.                                                                                                                                                                                                                    |
| F3  | **Confirmation tile uses the success triple, not green-50 on green-800.** | token        | The design paints `#F0FDF4` / `#166534`. `--success-soft` / `--success-strong` (`#E4F6EC` / `#0B7A3B`) is used instead so no palette literal enters and dark still resolves — the same call already recorded in `DIFFERENCE-LIST.md` A7 for the success alert. |
| F4  | **Client validation copy is authored.**                                   | no precedent | "Enter your work email" / "Enter a valid email address" match login's wording; the design has no validation state for this field, only the rate limit.                                                                                                         |

## C. Refactor performed — `AuthCard` / `AuthShell`

The card treatment was a class string duplicated across `login-form.tsx`,
`create-org-form.tsx` and `signup-account-form.tsx`, and the page container was duplicated
across all four `(auth)` routes. Building a fourth screen would have made it five copies,
so — **with sign-off, per the brief's stop condition** — both were extracted into
`features/auth/components/auth-card.tsx`:

- `AuthShell` — the design's `authPad` column plus the logo tile and wordmark.
- `AuthCard` — the design's `authCard`, rendered as the `<form>` itself so no wrapper
  element is added to any screen.

No value changed. Re-measured after the refactor, at 1440:

| Screen             | Card          | Radius / padding / gap | Unchanged?                                                                                       |
| ------------------ | ------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `/login`           | 440 × **512** | 16px · 32px · 18px     | ✓ matches `LOGIN-DIFF.md`'s 512                                                                  |
| `/create-org`      | 440 × **641** | 16px · 32px · 18px     | ✓ matches `SIGNUP-DIFF.md`'s 641                                                                 |
| `/signup`          | 440 × **682** | 16px · 32px · 18px     | ✓                                                                                                |
| `/forgot-password` | 440 × **337** | 16px · 32px · 18px     | ✓ new                                                                                            |
| `/onboarding`      | 620 × 577     | 16px · **30px** · 20px | ✓ deliberately NOT `AuthCard` — it uses the design's wider `wizCard`; only `AuthShell` is shared |

All 25 e2e specs pass after the refactor, including the ones that lock login, create-org
and signup-account behaviour.

## D. The walk — verified in the production build

Transcript in `verification/forgot-password--measurements.json` → `walk`.

| Action             | Result                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| Submit empty       | "Enter your work email" on the field, **no banner**, stays `/forgot-password`          |
| `nope`             | "Enter a valid email address", **no banner**                                           |
| `sam@northwind.io` | **"Check your inbox"** — the field and submit are replaced, "Back to sign in" stays    |
| "Resend link"      | rate limit trips: back to the form with the banner **and** "Rate limited" on the field |
| Any of the above   | **0 network requests** matching `api                                                   | mail | reset | token` — nothing is sent anywhere |

Also covered by `test/e2e/forgot-password.spec.ts`, including the round trip
login → forgot-password → login.

## E. Deliberately not built

- **Any real reset.** No email, no provider, no token, no session, no server action.
- **(b) the reset-link landing / new-password screen** and **(c) its success state** —
  both absent from the design (§1). Authored-territory, awaiting a decision.
- **A resend cooldown timer.** The design's copy mentions "try again in 60 seconds" but
  draws no timer; nothing counts down.

Dark renders are semantic-token output only — the design declares no dark rules.
