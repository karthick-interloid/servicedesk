import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeSkeleton } from "@/skeletons/home";

describe("HomeSkeleton", () => {
  it("renders three skeleton placeholders", () => {
    const { container } = render(<HomeSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });
});
