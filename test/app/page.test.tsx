import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

// Home is a synchronous Server Component, so Vitest can render it directly.
// (async Server Components are covered by the Playwright E2E tests instead.)
describe("Home page", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /ship production-ready apps/i,
      }),
    ).toBeInTheDocument();
  });

  it("links to the about page", () => {
    render(<Home />);
    const aboutLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/about");
    expect(aboutLinks.length).toBeGreaterThan(0);
  });
});
