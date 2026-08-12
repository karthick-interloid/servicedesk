import { z } from "zod";

/**
 * Saved-view payloads, validated at the Server Action boundary.
 *
 * The filter schema mirrors `SavedViewFilter` in ../types.ts exactly. It is validated even
 * though the design's modal cannot currently produce one — the Filter select there is inert
 * (see `saved-views-list.tsx`) — because a Server Action is a public POST endpoint and
 * `filter_json` is a jsonb column that would otherwise take whatever it was handed.
 */

const ticketStatus = z.enum(["new", "open", "pending", "on_hold", "resolved", "closed"]);
const ticketPriority = z.enum(["urgent", "high", "normal", "low"]);
const slaState = z.enum(["on_track", "at_risk", "breached", "met"]);

export const savedViewFilterSchema = z
  .object({
    status: z.array(ticketStatus).optional(),
    priority: z.array(ticketPriority).optional(),
    assignee: z
      .union([z.literal("me"), z.literal("unassigned"), z.object({ userId: z.uuid() })])
      .optional(),
    sla: z.array(slaState).optional(),
  })
  // No unknown keys: `matchesSavedViewFilter` ignores what it doesn't recognise, so an
  // unknown key would silently widen a view rather than fail.
  .strict();

/** The design's modal edits a name and nothing else, so that is the only required field. */
const name = z
  .string()
  .trim()
  .min(1, "Name this view.")
  .max(80, "Keep the name under 80 characters.");

export const createSavedViewSchema = z.object({
  name,
  filterJson: savedViewFilterSchema.optional(),
  isShared: z.boolean().optional(),
});

export const renameSavedViewSchema = z.object({
  id: z.uuid(),
  name,
});

export const shareSavedViewSchema = z.object({
  id: z.uuid(),
  isShared: z.boolean(),
});

export const deleteSavedViewSchema = z.object({
  id: z.uuid(),
});

export type CreateSavedViewValues = z.infer<typeof createSavedViewSchema>;
export type RenameSavedViewValues = z.infer<typeof renameSavedViewSchema>;
