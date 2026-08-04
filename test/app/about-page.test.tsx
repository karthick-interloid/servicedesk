import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";

describe("About page", () => {
  it("renders the heading with the site name from config", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /about test starter/i }),
    ).toBeInTheDocument();
  });

  it("renders the three pillars as level-2 headings", () => {
    render(<AboutPage />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  });

  it("links back home", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
  });
});
