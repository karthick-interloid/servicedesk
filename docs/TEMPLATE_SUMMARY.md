# Template Summary — ServiceDeskpro

> **This is Next.js 16 App Router, not Vite.** There is no `vite.config`, no `main.tsx`, no
> React Router, no Jest. Vite appears only as Vitest's transform layer. Tailwind is v4
> CSS-first — **no `tailwind.config.*` exists and none should be created.**

## Stack & versions

| Tool                                                                                                                         | Version                                      | Note                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| next                                                                                                                         | 16.3.0                                       | App Router, `reactCompiler: true`, `output: "standalone"` |
| react / react-dom                                                                                                            | 19.2.8                                       |                                                           |
| typescript                                                                                                                   | 5.9.3                                        | strict + 6 extra strict flags (see Conventions)           |
| tailwindcss / @tailwindcss/postcss                                                                                           | 4.3.3                                        | v4 CSS-first, config-file-less                            |
| shadcn (CLI + `shadcn/tailwind.css`)                                                                                         | 4.16.1                                       | runtime dep, not just a CLI                               |
| radix-ui                                                                                                                     | 1.6.7                                        | backs 23 of 38 ui primitives                              |
| @base-ui/react                                                                                                               | 1.7.0                                        | backs `combobox.tsx` only                                 |
| lucide-react                                                                                                                 | 1.28.0                                       | icon library per `components.json`                        |
| zod                                                                                                                          | 4.4.3                                        | env validation                                            |
| @sentry/nextjs                                                                                                               | 10.69.0                                      | via `withSentryConfig` + `instrumentation*.ts`            |
| vitest / @vitest/coverage-v8                                                                                                 | 4.1.10                                       | jsdom, **not Jest**                                       |
| @testing-library/react                                                                                                       | 16.3.2                                       | + jest-dom matchers via `vitest.setup.ts`                 |
| @playwright/test                                                                                                             | 1.62.1                                       | E2E only, chromium project                                |
| eslint / eslint-config-next                                                                                                  | 9.39.5 / 16.3.0                              | flat config                                               |
| prettier / prettier-plugin-tailwindcss                                                                                       | 3.9.6 / 0.8.1                                | class sorting reads `globals.css`                         |
| husky / lint-staged                                                                                                          | 9.1.7 / 17.3.0                               | pre-commit + pre-push hooks                               |
| class-variance-authority / tailwind-merge / clsx                                                                             | 0.7.1 / 3.6.0 / 2.1.1                        | `cn()` + variants                                         |
| tw-animate-css                                                                                                               | 1.4.0                                        | imported by `globals.css`                                 |
| recharts 3.8.0, cmdk 1.1.1, vaul 1.1.2, react-day-picker 10.0.1, embla-carousel-react 8.6.0, input-otp 1.4.2, date-fns 4.4.0 |                                              | shadcn component deps                                     |
| Node / npm                                                                                                                   | `>=24.0.0` / `>=10`, `.nvmrc` pins `24.15.0` |                                                           |

## Commands

```
npm run dev            # next dev
npm run build          # next build
npm run start          # next start
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run test           # vitest run
npm run test:watch     # vitest
npm run test:coverage  # vitest run --coverage
npm run test:e2e       # playwright test
npm run test:e2e:ui    # playwright test --ui
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm run docker:build   # docker build -t starter-template .
npm run docker:run     # docker run --rm -p 3000:3000 --env-file .env.local starter-template
npm run sentry:test    # node --env-file-if-exists=.env.local scripts/sentry-connectivity-test.mjs
```

Git hooks: `.husky/pre-commit` → `npx lint-staged`; `.husky/pre-push` → `npm run typecheck && npm run build`.
Add a shadcn component: `npx shadcn add <name>` (supports `--dry-run`, `--diff`, `--view`).

## Structure map

```
src/
  app/                  routes (Next file-system routing; fixed location)
    globals.css         THE single CSS entry point + token layer
    layout.tsx          root layout: fonts, metadata, theme script, ThemeProvider, ThemeToggle
    page.tsx            /            about/page.tsx  /about
    loading.tsx         Suspense fallback → renders <HomeSkeleton/>
    error.tsx           route error boundary ("use client")
    global-error.tsx    replaces root layout entirely; re-imports globals.css + theme script
    not-found.tsx       404
    api/health/route.ts GET /api/health, optional bearer token, 404 on mismatch
    robots.ts sitemap.ts opengraph-image.tsx twitter-image.tsx   generated metadata routes
  components/
    ui/                 38 shadcn primitives — CLI-managed, do not hand-write here
    shared/             composed app-wide pieces (Header/Footer/Container). Has theme-toggle.tsx
  context/              cross-app React providers. Has theme-provider.tsx
  hooks/                shared hooks. Has use-mobile.ts
  lib/                  framework-agnostic utils: utils.ts (cn), theme.ts
  config/               site.ts (plain data), env.ts (zod, THROWS at import)
  skeletons/            route-shaped loading skeletons (home.tsx). Single placeholders → ui/skeleton.tsx
  features/             EMPTY (.gitkeep) — feature-scoped code lives here: features/<name>/{components,schemas,actions.ts}
  services/ store/ schemas/ types/ actions/   EMPTY (.gitkeep) — see docs/CONVENTIONS.md
  instrumentation.ts instrumentation-client.ts   Sentry; fixed location, do not move
test/                   mirrors src/ 1:1 — src/lib/utils.ts → test/lib/utils.test.ts
  e2e/                  Playwright *.spec.ts, excluded from the Vitest run
```

There is **no `middleware.ts` and no `proxy.ts`** — deliberate, so the static CSP keeps
routes statically generated. No route guards or redirects exist anywhere.

## Wiring facts

Load-bearing, verbatim:

- **CSS entry point:** `src/app/globals.css` — the _only_ `.css` file in `src/`.
  Imported by `src/app/layout.tsx:4` and `src/app/global-error.tsx:5` (the second is required,
  not a duplicate: `global-error` replaces the root layout).
- **Import alias:** `"@/*": ["./src/*"]` (`tsconfig.json`). Vitest gets it via `vite-tsconfig-paths`,
  so aliases are derived from tsconfig and cannot drift.
- **Dark-mode selector:** `.dark` class on `<html>`, declared as
  `@custom-variant dark (&:is(.dark *));` (`globals.css:5`). Storage key `"theme"` in `localStorage`.
- **components.json:** `style: "radix-nova"`, `tailwind.config: ""` (v4 signal), `tailwind.css:
"src/app/globals.css"`, `baseColor: "neutral"`, `cssVariables: true`, `rsc: true`, `tsx: true`,
  `iconLibrary: "lucide"`. Aliases: `components → @/components`, `ui → @/components/ui`,
  `utils → @/lib/utils`, `lib → @/lib`, `hooks → @/hooks`.
- **Verified:** `npx shadcn add badge --dry-run` writes to `src/components/ui/badge.tsx`.
- **Root font-size is browser-default 16px** — no `font-size` declaration exists in `src/`,
  in Tailwind's preflight `html` block, or in `shadcn/tailwind.css`. Keep it that way.
- `globals.css` imports `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css` (from
  `node_modules`). The last contributes only keyframes, `data-*` variants, and
  `scroll-fade`/`no-scrollbar` utilities — **no color tokens, no competing palette.**

## Component inventory

All 38 `ui/` files are **byte-identical to the stock `radix-nova` registry** (verified via
`shadcn add <all> --dry-run` → `skip (identical)`). Zero shadcn-modified files exist today.

| Name                                                                                                                                                                                                                                                                                          | Kind         | Location                                 | Purpose                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------- | ---------------------------------------------------------- |
| accordion, alert, alert-dialog, avatar, badge, breadcrumb, card, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, input, input-group, input-otp, label, pagination, popover, progress, scroll-area, select, separator, sheet, sidebar, tabs, textarea, toggle, tooltip | shadcn-stock | `src/components/ui/<name>.tsx`           | Radix-backed primitives                                    |
| calendar                                                                                                                                                                                                                                                                                      | shadcn-stock | `src/components/ui/calendar.tsx`         | react-day-picker + date-fns                                |
| carousel                                                                                                                                                                                                                                                                                      | shadcn-stock | `src/components/ui/carousel.tsx`         | embla-carousel-react                                       |
| chart                                                                                                                                                                                                                                                                                         | shadcn-stock | `src/components/ui/chart.tsx`            | recharts wrapper                                           |
| combobox                                                                                                                                                                                                                                                                                      | shadcn-stock | `src/components/ui/combobox.tsx`         | **@base-ui/react**, not radix                              |
| command                                                                                                                                                                                                                                                                                       | shadcn-stock | `src/components/ui/command.tsx`          | cmdk palette                                               |
| drawer                                                                                                                                                                                                                                                                                        | shadcn-stock | `src/components/ui/drawer.tsx`           | vaul                                                       |
| button                                                                                                                                                                                                                                                                                        | shadcn-stock | `src/components/ui/button.tsx`           | cva variants; exports `buttonVariants`                     |
| skeleton                                                                                                                                                                                                                                                                                      | shadcn-stock | `src/components/ui/skeleton.tsx`         | pulse placeholder                                          |
| use-mobile                                                                                                                                                                                                                                                                                    | shadcn-stock | `src/hooks/use-mobile.ts`                | `useIsMobile()`, 768px breakpoint                          |
| ThemeToggle                                                                                                                                                                                                                                                                                   | custom       | `src/components/shared/theme-toggle.tsx` | 3-way Light/Dark/System `role="group"`                     |
| ThemeProvider / useTheme                                                                                                                                                                                                                                                                      | custom       | `src/context/theme-provider.tsx`         | Theme state via `useSyncExternalStore`                     |
| theme primitives                                                                                                                                                                                                                                                                              | custom       | `src/lib/theme.ts`                       | Storage key, `DARK_CLASS`, `applyTheme`, `themeInitScript` |
| cn                                                                                                                                                                                                                                                                                            | custom       | `src/lib/utils.ts`                       | `twMerge(clsx(...))`                                       |
| HomeSkeleton                                                                                                                                                                                                                                                                                  | custom       | `src/skeletons/home.tsx`                 | Route-level loading placeholder                            |
| siteConfig                                                                                                                                                                                                                                                                                    | custom       | `src/config/site.ts`                     | name/url/description/twitterHandle                         |
| env                                                                                                                                                                                                                                                                                           | custom       | `src/config/env.ts`                      | Zod-validated `process.env`; **throws at import**          |

Key signatures:

```ts
cn(...inputs: ClassValue[]): string
useTheme(): { theme; resolvedTheme; systemTheme; setTheme(t: Theme): void }
<ThemeProvider defaultTheme?: Theme = "system">   <ThemeToggle className?: string />
useIsMobile(): boolean
<Button variant? size? asChild? className? {...React.ComponentProps<"button">} />
buttonVariants({ variant, size, className })   // preferred for link-as-button
```

## Token slots

All tokens live in `src/app/globals.css`. Two layers: `@theme inline` (`:23-64`) maps Tailwind
utility names → raw vars; `:root` (`:66-99`) and `.dark` (`:101-133`) hold the raw values.

**Design-replaceable** (change these; both `:root` and `.dark` must be updated together):

- Surfaces/text: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`,
  `--popover-foreground`, `--muted`, `--muted-foreground`
- Brand/intent: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`,
  `--accent`, `--accent-foreground`, `--destructive`
- Lines/focus: `--border`, `--input`, `--ring`
- Data-viz: `--chart-1` … `--chart-5` — **currently all greys in both themes**
- Sidebar: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`,
  `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`,
  `--sidebar-border`, `--sidebar-ring`
- Geometry: `--radius` (`0.625rem`) — the single knob driving `--radius-sm|md|lg|xl|2xl|3xl|4xl`
- Type: `--font-heading` (currently just aliases `--font-sans`)

**Starter infrastructure — do not repurpose:**

- `--font-sans` is set by `next/font` (`Inter`, `layout.tsx:10`) and re-exported through
  `@theme inline`; changing the font means changing the `next/font` call, not the token.
- The `--color-*` entries in `@theme inline` are _mappings_, not values. Edit the raw
  `:root`/`.dark` vars; leave the mapping block alone.
- The `--radius-*` derived steps are `calc()` off `--radius`; retune `--radius`, not the steps.

## Conventions

- **Files are kebab-case** (`theme-toggle.tsx`, `alert-dialog.tsx`); component exports are PascalCase.
- **Use named exports** for custom components. Default exports only where Next.js requires them
  (pages, layouts, `error.tsx`, `robots.ts`, `sitemap.ts`).
- **Always import via `@/`.** No relative cross-folder imports.
- **Keep screens thin.** `app/loading.tsx` renders `<HomeSkeleton/>` and nothing else; pages compose
  from `ui/` + `shared/` and delegate. Server Actions stay thin and call `services/`.
- **Put tests in the mirrored `test/` tree**, never beside the source. `test/e2e/*.spec.ts` for
  Playwright. Import `{ describe, expect, it }` from `vitest` explicitly even though `globals: true`.
  Query by accessible role/name; assert `data-slot` attributes and class substrings.
- **Never add feature-specific code** to `shared/`, `hooks/`, `types/`, `schemas/`, `context/`,
  `services/`, `store/`, `skeletons/`, or `actions/` — those are for genuinely cross-feature code.
- **Delete a folder's `.gitkeep`** when you add its first real file.
- **Satisfy the strict flags:** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`.
  The last one forbids passing `undefined` to an optional prop — use conditional spreads:
  `...(x ? { site: x } : {})` (pattern at `layout.tsx:34`).
- **Prettier:** semi, double quotes, trailing commas, printWidth 100.

## Extension points

- **New shadcn component:** `npx shadcn add <name>`. It lands in `src/components/ui/<name>.tsx`
  automatically. Run `--dry-run` first. Do not hand-author files in `ui/`.
- **New cva variant:** extend the `cva()` call in the component itself (pattern:
  `src/components/ui/button.tsx`) using only semantic tokens. Prefer
  `cn(buttonVariants({ variant, size }), extra)` at call sites over wrapper components.
- **New feature:** create `src/features/<name>/` with its own `components/`, `schemas/`,
  `actions.ts`. Feature code never goes in the shared folders.
- **New route:** `src/app/<segment>/page.tsx`, with a `metadata` export for per-page SEO
  (pattern: `src/app/about/page.tsx`). Add the URL to `src/app/sitemap.ts`. Code-splitting is
  automatic; do not reach for `React.lazy`/`next/dynamic`.
- **New env var:** add it to the schema in `src/config/env.ts`, to `.env.example`, to the
  `build` job env block in `.github/workflows/ci.yml`, to the Dockerfile `ARG`/`ENV` pair if it's
  needed at build time, and to `vitest.config.mts`'s `test.env` if any tested module reads it.
- **New global provider:** `src/context/`, then wrap in `layout.tsx` inside `<ThemeProvider>`.

## Known constraints

1. **Committing `ui/` files rewrites all 38 of them.** They are currently raw CLI output
   (no semicolons); `lint-staged` runs `prettier --write` on staged `.tsx`, which adds semicolons
   and destroys the `shadcn --dry-run → identical` drift check. This already happened once to
   `button.tsx`/`skeleton.tsx`. Decide on `.prettierignore` for `src/components/ui/**` before
   committing. Do not "fix" the missing semicolons by hand.
2. **`text-accent` is near-invisible.** `--accent` is a _surface_ token (`oklch(0.97 0 0)` light on
   a white background; `oklch(0.269 0 0)` dark on near-black). `src/app/page.tsx:34` and `:50` use
   it as a text/icon color. Use `--accent-foreground` or `--primary` for text.
3. **Chart tokens are greyscale** in both themes — redefine `--chart-1..5` before shipping data-viz.
4. **`--sidebar-primary` is inconsistent:** grey in `:root`, saturated blue
   (`oklch(0.488 0.243 264.376)`) in `.dark`. Stock leftover; fix when a sidebar is built.
5. **Radius scale deviates from Tailwind defaults** (`rounded-sm` = 0.375rem here vs 0.125rem
   stock). Pasted markup using stock radii will render rounder than designed.
6. **The CSP blocks external assets.** `font-src 'self'`, `img-src 'self' data: blob:`,
   `connect-src 'self'` + the Sentry ingest host (`next.config.ts`). Google Fonts, icon CDNs, and
   remote images fail silently in the browser while type-check and build pass. Self-host instead.
7. **Two primitive libraries are live** (radix-ui + @base-ui/react for combobox). Import from the
   one the component already uses; mixing creates duplicate trees and inconsistent `data-*` state.
8. **`src/config/env.ts` throws at import time**, and `siteConfig` imports it. Any new harness
   (Storybook, a preview script) needs a fake env block like `vitest.config.mts:13-20`.
9. **36 of 38 `ui/` primitives have no tests** — only `button` and `skeleton` are covered.
   Restyling them has no safety net.
10. **`docs/CONVENTIONS.md` is stale** where it calls `shared/`, `context/`, and `hooks/` empty.
    Trust this file and the tree over that description.
11. **`dark:` utilities on `<html>` itself do not work** — `&:is(.dark *)` matches descendants
    of `.dark`, and `.dark` sits on `<html>`.
12. **Do not** create `tailwind.config.js`, add a second `.css` entry, set `html`/`body`
    `font-size`, switch CI to `npm ci` (documented deliberate choice in `AGENTS.md` /
    `.github/workflows/ci.yml`), or add a `middleware.ts`/`proxy.ts` without accepting that every
    route becomes dynamic.
