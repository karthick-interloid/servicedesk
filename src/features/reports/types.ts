/**
 * The Reports screen's demo states.
 *
 * The design registers exactly two (`states: ["Default", "Loading"]` in the capture
 * report) — there is no empty state and no error state on this screen, unlike the queue's
 * four. Reports is an aggregate view: with no tickets the figures are zeroes, not an empty
 * card, and the design draws no zero-state for them. Noted in docs/REPORTS-DIFF.md.
 */
export type ReportsState = "default" | "loading";
