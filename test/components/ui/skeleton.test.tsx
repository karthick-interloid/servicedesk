import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders with the pulse animation and skeleton data-slot", () => {
    render(<Skeleton data-testid="sk" />);
    const el = screen.getByTestId("sk");
    expect(el).toHaveAttribute("data-slot", "skeleton");
    expect(el).toHaveClass("animate-pulse");
  });

  it("merges a custom className", () => {
    render(<Skeleton data-testid="sk" className="h-8 w-48" />);
    expect(screen.getByTestId("sk")).toHaveClass("h-8", "w-48");
  });
});
