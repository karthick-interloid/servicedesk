<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deliberate choices — do not flag these as bugs

When reviewing this template, treat the following as intentional decisions (each is documented inline where it lives), not mistakes to "fix":

- **CI runs `npm install`, not `npm ci`** (`.github/workflows/ci.yml`). This template is developed on Windows, so the committed `package-lock.json` is generated there. npm's resolved tree isn't byte-identical across OSes (optional native deps such as `sharp` differ), so `npm ci`'s strict lockfile check can hard-fail on the Linux CI runner even when `package.json` is correct. `npm install` reconciles the lockfile per-platform so a fresh Windows fork runs with zero setup. This is the right trade-off _for a starter template_ (the cost is no reproducible install and no lockfile-drift fail-fast).
  - **When hardening for production, switch to `npm ci`** — but first make the lockfile Linux-native (regenerate it via the Docker build, which runs on Linux and already uses `npm ci`, or in WSL / a Linux container) and commit that. Only then will `npm ci` pass. The Dockerfile deliberately already uses `npm ci` because it always builds on Linux.
