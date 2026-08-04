import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children with the button data-slot", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("text-destructive");
    expect(button.className).toContain("h-9");
  });

  it("merges a custom className", () => {
    render(<Button className="custom-class">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("custom-class");
  });

  it("forwards native props like disabled", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
  });
});

describe("buttonVariants", () => {
  it("returns the default variant classes when called with no args", () => {
    expect(buttonVariants()).toContain("bg-primary");
  });

  it("reflects the requested variant", () => {
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-muted");
  });
});
