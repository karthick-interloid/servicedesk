import type { Page } from "@playwright/test";

/**
 * Blocks until React has hydrated the page's form.
 *
 * Every auth screen is a controlled React form rendered on the server first. A `fill()`
 * that lands before hydration writes straight to the DOM, React never sees it, and the
 * derived UI (a live hint, a validation error) never updates — which surfaces as a test
 * that fails on one run and passes on the next, especially under `next dev`, where the
 * first request to a route also pays for its compile.
 *
 * React tags every host node it owns with a `__reactFiber$…` key at hydration time, so its
 * presence on the form is a precise signal rather than a timeout guess.
 */
export async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const form = document.querySelector("form");
    return Boolean(form) && Object.keys(form!).some((key) => key.startsWith("__reactFiber$"));
  });
}
