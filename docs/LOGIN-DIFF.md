# Difference list — Login screen vs `Update design.dc.html`

Scope: `/login`, default and error states. Unauthenticated — the route lives in the new
`(auth)` group and inherits none of the `(app)` shell.

**Ground truth.** `Update design.dc.html` (revision `1786086606842887`) → the `scrLogin`
block, `authPad` and `authCard`; and `design-reference/log-in--light.png` /
`log-in--error--light.png`. Both captures are **1:1 at 1440** — the card measures exactly
440px, its CSS `max-width` — so pixel offsets in them are CSS pixels.

**Evidence.** Captured against `npm run build && npm run start`, Chromium,
`deviceScaleFactor: 1`, animations frozen. Build numbers are DOM measurements in
`verification/login--measurements.json`.

| File                                                      | What                                 |
| --------------------------------------------------------- | ------------------------------------ |
| `verification/login--{1440,375}--{light,dark}.png`        | default state                        |
| `verification/login--error--{1440,375}--{light,dark}.png` | error state                          |
| `verification/login--measurements.json`                   | DOM geometry + validation transcript |
| `verification/crops/login-default-band.png`               | design crop, form band, default      |
| `verification/crops/login-error-band.png`                 | design crop, form band, error        |

The error state is reached **through the UI only** — fill the password, press Sign in.
Nothing is stubbed or forced.

---

## A. Verified as matching

Measured from the design capture, against the built DOM.

| Property                    | Design                                      | Build                                  |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| Card width                  | 440px (`maxWidth: "440px"`)                 | 440px ✓                                |
| Card radius / padding / gap | 16px · 32px · 18px                          | 16px · 32px · 18px ✓                   |
| Card height, default        | 515px (y 308–822)                           | 512px ✓ (−3px)                         |
| Card height, error          | 647px (y 242–888)                           | 649px ✓ (+2px)                         |
| Card, below md              | 100% width, 20px page gutter, 24/20 padding | 335px at 375, `px-5 py-6` ✓            |
| Logo tile                   | 34px, 8px radius, `#0F766E`, 16px/800       | 34px, `rounded-md`, `#0F766E` ✓        |
| Email field                 | 42px (y 441–482), 6px radius, `#CBD5E1`     | 42px, 6px, `#CBD5E1` ✓                 |
| Password field              | 42px (y 522–563)                            | 42px ✓                                 |
| Field height, below md      | 44px touch floor                            | 44px at 375 ✓                          |
| Sign in button              | 52px (y 616–667), teal fill                 | 52px, `#0F766E` ✓                      |
| Continue with Google        | 52px (y 703–754), bordered, brand label     | 52px, `neutral` variant, teal label ✓  |
| Error banner                | 91px, `#FEF2F2` fill, icon + bold lead      | 93px, `#FEF2F2` ✓                      |
| Password field, in error    | `#DC2626` border, 42px, red halo            | `#DC2626`, 42px, `aria-invalid` ring ✓ |
| Field error text            | "Incorrect password", below the field       | identical, `text-destructive-strong` ✓ |
| Email field, in error       | **not** in error — normal border            | `#CBD5E1`, untouched ✓                 |
| Shell chrome                | none                                        | 0 sidebars, 0 headers in the DOM ✓     |

**Error structure, as the design draws it — both, not either:** a form-level alert banner
at the top of the card _and_ a field-level error on Password only. The email field keeps
its normal border. The hint slot is replaced by the error, never stacked with it.

## B. Deviations

| #   | Difference                                                                      | Cause             | Detail                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1  | **Brand surfaces paint from a new `--brand-accent`, not `--primary`.**          | approved decision | The Log in capture measures **5,463px of `#0F766E` and zero pixels of `#166534`**. `--primary` is green because it is transcribed from `Design System.dc.html`, which measures 96,774px of green-800. Per your decision, `--brand-accent: #0F766E` was **added** to `globals.css` — no existing value moved. `/design-system` and the shell sidebar are untouched. |
| L2  | **Org reads "Interloid", not "Northwind Support"; tile glyph is `I`, not `N`.** | data, not design  | The design hardcodes `N` in the auth markup — Northwind's initial — while exposing `orgInitial: org[0]` elsewhere. The glyph is org-derived; the brief names this org Interloid, and the shell already renders it. One line in `features/shell/lib/identity.ts` if you want the design's tenant instead.                                                           |
| L3  | **Alert border is `border-destructive/25`, the design's is `#F5B5B5`.**         | design-ambiguity  | Pre-existing and already logged as `DIFFERENCE-LIST.md` A6: the design's markup uses solid 200-step borders while its own snippet writes the token form. Snippet form kept, so no palette literal enters an app primitive. Slightly lower contrast at the banner edge.                                                                                             |
| L4  | **Field height is 42px, not the form census's 40px.**                           | census vs screen  | `docs/DESIGN_SUMMARY.md` and `components-map.md` both document `h-11 md:h-10` (44/40). This screen measures **42px** at 1440. The screen wins, per the standing rule: `h-11 md:h-10.5`. Worth reconciling against the other form screens in a later pass.                                                                                                          |
| L5  | **The email field is pre-filled with `sam@northwind.io`.**                      | design            | The design ships `default-value="sam@northwind.io"`, and the capture renders it. Kept so the screenshots match. It is a prototype convenience, not a login pattern — delete `SEED_EMAIL` when real auth lands.                                                                                                                                                     |

## C. Upstream defect — found here, fixed upstream

**`ui/alert.tsx` never applied its `tone` prop.** The file declared a five-tone cva group
(`info` / `success` / `warning` / `error`) and typed it through `VariantProps`, so
`tone="error"` typechecked — but `Alert` destructured only `{ className, variant }` and
called `alertVariants({ variant })`. `tone` never reached the cva, leaked onto the DOM as a
stray attribute, and every toned alert rendered plain white `bg-card`.

**RESOLVED 2026-08-07** by a signed-off correctness edit to `src/components/ui/alert.tsx`
— an authorised exception to the no-`ui/`-edits rule. Two lines: `tone` is destructured and
forwarded as `alertVariants({ variant, tone })`. No variant was added, no style changed, no
design moved; the whole diff is 2 lines plus the inline rationale comment. The `className`
workaround at this screen's call site is gone — it now reads `<Alert tone="error">` with
only its own 10px radius and 12/14px padding.

Measured after the fix, with no `tone` attribute reaching the DOM on any of them:

| Tone      | Surface   | Ink       | Token pair                                    |
| --------- | --------- | --------- | --------------------------------------------- |
| `error`   | `#FEF2F2` | `#B91C1C` | `--destructive-soft` / `--destructive-strong` |
| `warning` | `#FFFBEB` | `#B45309` | `--warning-soft` / `--warning-strong`         |
| `success` | `#E4F6EC` | `#0B7A3B` | `--success-soft` / `--success-strong`         |
| `info`    | `#EEF2FF` | `#3730A3` | `--info-soft` / `--info-strong`               |

The login banner is unchanged from the accepted version — `#FEF2F2` on `#B91C1C`, 10px
radius, 374×93px, byte-for-byte the same render.

**Drift-check exception.** `shadcn add alert --dry-run` will no longer report
`skip (identical)` for `alert.tsx`. Accepted and recorded inline at the top of the file and
in `.prettierignore`, whose `src/components/ui/**` glob already covers it — so `lint-staged`
will not reformat the rest of the file on commit. Every other file under `ui/` is still
byte-identical to stock.

**Knock-on:** the four toned alerts on `/design-system` (`features/design-system/components/
part-02.tsx`) were rendering white too. They now paint their design surfaces. That route's
own captures under `verification/design-system--*.png` predate the fix and are stale for
the Alerts & banners section; see the note added to `docs/DIFFERENCE-LIST.md`.

## D. Deliberately not built

- **Real authentication.** No session, no cookie, no server action, no provider. Submit is
  intercepted with `preventDefault`, validated in React state, and never navigates —
  asserted in `test/e2e/login.spec.ts`.
- **`/forgot-password` and `/signup`.** The links render and 404 by design; those screens
  are later phases.
- **"Continue with Google" is inert.** Per your decision it is transcribed exactly — 52px,
  bordered, brand-tinted label, below the `or` divider — but has no OAuth, no provider and
  no handler. Deleting it is one block if the provider question resolves differently.
- **"Keep me signed in" is presentational.** It toggles, but there is no session for it to
  extend.
- **`react-hook-form` / `ui/form.tsx`.** Declined, matching the design-system phase: both
  need dependencies the brief forbids. Validation is plain React state; the design's
  "error replaces hint, never stacks" rule is honoured by hand.

## E. Client validation, as verified

Exercised through the UI in `verification/login--measurements.json` → `validation`:

| Input                            | Result                                                   |
| -------------------------------- | -------------------------------------------------------- |
| Empty password                   | field error "Enter your password", **no** banner         |
| `not-an-email` + password        | field error "Enter a valid email address", **no** banner |
| Valid email + non-empty password | banner + "Incorrect password" on the password field      |
| Any submit                       | URL stays `/login` — no navigation                       |

The banner is reserved for a credential failure, which is what the design's copy describes;
shape errors stay at field level.
