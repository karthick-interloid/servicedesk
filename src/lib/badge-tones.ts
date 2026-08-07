/**
 * Single source for every status pill. Required by components-map.md rule 5:
 * "Status and priority colour always resolves through `lib/badge-tones.ts`, never a literal
 * Tailwind palette class."
 *
 * Recipe from docs/treatments.md §3.1 — soft surface + strong text + 25% inset ring,
 * `rounded-full`, `text-xs`. Every value resolves through a theme token, so a token change
 * repaints every pill and no palette class appears here.
 *
 * `toneClass` and `toneDot` are consumed directly as the additive `tone` cva group in
 * `ui/badge.tsx` (components-map.md row 43). They live here rather than there so the
 * recipe and the semantic mappings below stay in one file, exactly as the design's own
 * `lib/badge-tones.ts` snippet has it.
 */

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "error";

/** tone → classes. `rounded-full` and the inset ring both override stock badge base. */
export const toneClass: Record<Tone, string> = {
  neutral: "rounded-full bg-secondary text-secondary-foreground ring-1 ring-border ring-inset",
  brand: "rounded-full bg-accent text-accent-foreground ring-1 ring-primary/20 ring-inset",
  info: "rounded-full bg-info-soft text-info-strong ring-1 ring-info/25 ring-inset",
  success: "rounded-full bg-success-soft text-success-strong ring-1 ring-success/25 ring-inset",
  warning: "rounded-full bg-warning-soft text-warning-strong ring-1 ring-warning/25 ring-inset",
  error:
    "rounded-full bg-destructive-soft text-destructive-strong ring-1 ring-destructive/25 ring-inset",
};

/**
 * Leading dot fill — present when the badge answers *what state is this in* (status, SLA,
 * health), absent when it answers *what kind is this* (priority, plan, category).
 * The fill is the **base** of the triple, never the strong (treatments §3.1).
 */
export const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  brand: "bg-primary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
};

/** The design's own mappings, from its `lib/badge-tones.ts` snippet. */
export const priorityTone: Record<string, Tone> = {
  Urgent: "error",
  High: "warning",
  Normal: "info",
  Low: "neutral",
};

export const statusTone: Record<string, Tone> = {
  New: "neutral",
  Open: "info",
  Pending: "warning",
  Solved: "success",
};
