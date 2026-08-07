#!/usr/bin/env node
/**
 * Reproducible screenshot harness.
 *
 * WHY A SCRIPT AND NOT `test/e2e/capture.spec.ts`:
 *  1. It asserts nothing. It is a tool, not a test — putting it under `testDir: ./test/e2e`
 *     would add ~7 full-page captures to every `npm run test:e2e`, making the suite slow and
 *     side-effecting for no assertion value.
 *  2. It needs arguments (route, screen name, widths). Playwright specs take none cleanly.
 *  3. It writes into `verification/`, a git-ignored artefact directory. A test that emits
 *     binaries on every run is a side effect disguised as a check.
 *  4. Excluding one spec from the default run would mean editing `projects` in
 *     playwright.config.ts, which is forbidden.
 * It reuses the same `@playwright/test` chromium binary — no new dependency, and
 * playwright.config.ts is untouched.
 *
 * REQUIRES the dev server already running (`npm run dev`). The config's `webServer` block only
 * applies to `playwright test`, and this deliberately does not go through it.
 *
 *   node scripts/capture.mjs --route /design-system --screen design-system
 *   node scripts/capture.mjs --route /design-system --screen design-system --widths 1440,2560
 *   node scripts/capture.mjs --route /design-system --screen design-system --widths 1440 --measure
 *   node scripts/capture.mjs --route /design-system --screen design-system --theme dark
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env["CAPTURE_BASE_URL"] ?? "http://localhost:3000";
const OUT_DIR = "verification";

/** Names match the existing design-reference/responsive/ convention exactly. */
const VIEWPORT_NAMES = {
  375: "mobile",
  768: "tablet",
  1024: "lg",
  1280: "laptop",
  1440: "desktop",
  1920: "large",
  2560: "ultra",
  3840: "uhd",
};

/** The design's ladder. 3840 is opt-in, for verifying a content cap holds. */
const LADDER = [375, 768, 1024, 1280, 1440, 1920, 2560];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

/**
 * Kills every source of frame-to-frame variance, so two runs of the same commit produce
 * byte-comparable PNGs: no transitions, no keyframes, no smooth scrolling, no caret.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

/** Geometry probes that answer the open difference-list questions with real numbers. */
const MEASURE_SCRIPT = () => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const rowsOf = (nodes) => {
    const tops = [...new Set(nodes.map((n) => Math.round(n.getBoundingClientRect().top)))];
    return tops.length;
  };
  const grid = document.querySelector("main")?.parentElement ?? null;
  const neutrals = [...document.querySelectorAll("#color .grid")][1];
  const triples = [...document.querySelectorAll("#color .grid")][2];
  const buttons = [...document.querySelectorAll("#buttons button")];

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    pageGrid: box(grid),
    main: box(document.querySelector("main")),
    nav: box(document.querySelector("nav")),
    masthead: box(document.querySelector("header")),
    neutrals: neutrals
      ? { cols: getComputedStyle(neutrals).gridTemplateColumns.split(" ").length, rows: rowsOf([...neutrals.children]), count: neutrals.children.length }
      : null,
    statusTriples: triples
      ? { cols: getComputedStyle(triples).gridTemplateColumns.split(" ").length, rows: rowsOf([...triples.children]), count: triples.children.length }
      : null,
    buttonHeights: buttons.slice(0, 12).map((b) => ({
      label: (b.textContent ?? "").trim().slice(0, 22),
      h: Math.round(b.getBoundingClientRect().height),
    })),
  };
};

/**
 * Chromium's compositor caps a single surface at 16384px. `fullPage: true` past that
 * returns a correctly-sized PNG whose lower region is BLANK WHITE — it fails silently,
 * which is worse than erroring. This page is ~27,000px tall, so every full-page capture
 * of it was quietly losing everything below the Overlays section.
 *
 * Fix: capture in sub-16384px windows via `clip` (which does scroll and render) and
 * stitch them with sharp, which is already a dependency (next/image).
 */
const MAX_SURFACE = 15000;

async function captureFullPage(page, file, width) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const shot = (clip) =>
    page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", ...(clip ? { clip } : {}) });

  if (height <= MAX_SURFACE) {
    await writeFile(file, await shot(null));
    return;
  }

  const { default: sharp } = await import("sharp");
  const tiles = [];
  for (let y = 0; y < height; y += MAX_SURFACE) {
    const h = Math.min(MAX_SURFACE, height - y);
    tiles.push({ input: await shot({ x: 0, y, width, height: h }), top: y, left: 0 });
  }
  await sharp({ create: { width, height, channels: 4, background: "#ffffff" } })
    .composite(tiles)
    .png()
    .toFile(file);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const route = typeof args["route"] === "string" ? args["route"] : "/design-system";
  const screen = typeof args["screen"] === "string" ? args["screen"] : route.replace(/^\//, "") || "index";
  const widths =
    typeof args["widths"] === "string"
      ? args["widths"].split(",").map((w) => Number.parseInt(w.trim(), 10))
      : LADDER;
  const measure = args["measure"] === true;
  /* Both themes. The app's dark selector is `.dark` on <html> (globals.css:5), set from
     localStorage["theme"] by the init script in layout.tsx — so seeding storage before
     first paint is what makes a dark capture faithful rather than a post-hoc class flip. */
  const theme = args["theme"] === "dark" ? "dark" : "light";

  const res = await fetch(`${BASE_URL}${route}`).catch(() => null);
  if (!res?.ok) {
    console.error(
      `✗ ${BASE_URL}${route} is not responding. Start the dev server first: npm run dev`,
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t);
    } catch {
      /* storage unavailable — the class fallback below still applies */
    }
  }, theme);
  const page = await context.newPage();
  const measurements = {};

  for (const width of widths) {
    const name = VIEWPORT_NAMES[width] ?? `w${width}`;
    // The CSS viewport — not a window resize, which does not change layout at all.
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.evaluate((t) => {
      document.documentElement.classList.toggle("dark", t === "dark");
    }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle");

    if (measure) measurements[width] = await page.evaluate(MEASURE_SCRIPT);

    const file = path.join(OUT_DIR, `${screen}--${name}-${width}--${theme}.png`);
    await captureFullPage(page, file, width);
    console.log(`✓ ${file}`);
  }

  if (measure) {
    const file = path.join(OUT_DIR, `${screen}--measurements-${theme}.json`);
    await writeFile(file, `${JSON.stringify(measurements, null, 2)}\n`);
    console.log(`✓ ${file}`);
    console.log(JSON.stringify(measurements, null, 2));
  }

  await browser.close();
}

await main();
