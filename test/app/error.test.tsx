import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

// Aliased so it does not shadow the global `Error` constructor used below.
import ErrorBoundary from "@/app/error";

describe("Error boundary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports the error to Sentry on mount", () => {
    const error = new Error("boom");
    render(<ErrorBoundary error={error} unstable_retry={vi.fn()} />);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  });

  it("shows the error digest when present", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorBoundary error={error} unstable_retry={vi.fn()} />);
    expect(screen.getByText(/Error ID: abc123/)).toBeInTheDocument();
  });

  it("calls unstable_retry when the retry button is clicked", () => {
    const retry = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} unstable_retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
