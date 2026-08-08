import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "@/app/(app)/page";

// The starter landing page was removed when the authenticated shell took over `/`.
// DashboardPage is a synchronous Server Component, so Vitest can render it directly.
describe("Dashboard page", () => {
  it("renders the placeholder heading", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /dashboard — coming soon/i }),
    ).toBeInTheDocument();
  });
});
