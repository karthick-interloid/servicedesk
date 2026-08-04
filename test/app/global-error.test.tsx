import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

import GlobalError from "@/app/global-error";

describe("GlobalError boundary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports the error to Sentry and renders the message", () => {
    const error = new Error("critical");
    render(<GlobalError error={error} unstable_retry={vi.fn()} />);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  });

  it("calls unstable_retry on button click", () => {
    const retry = vi.fn();
    render(<GlobalError error={new Error("critical")} unstable_retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
