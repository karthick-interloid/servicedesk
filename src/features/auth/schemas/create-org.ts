import { z } from "zod";

/** Lowercase alphanumerics and inner hyphens — what a subdomain label allows. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * No registry exists, so the design's own seeded address stands in for a taken one. That
 * is what makes the error state reachable through the UI — and it also means the screen's
 * default state is deliberately not advanceable.
 */
const TAKEN_SLUG = "northwind";

/**
 * Step 2 of 4. `.trim().toLowerCase()` runs BEFORE the pattern check, so `Acme EU` fails
 * on the space rather than on the capitals — matching what the screen did before the
 * schema existed.
 */
export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Enter an organization name"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter a portal address")
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only")
    .refine((slug) => slug !== TAKEN_SLUG, {
      message: `That address is taken. Try ${TAKEN_SLUG}-support.`,
    }),
  // Always a valid id: the Select is seeded and cannot be cleared.
  timezone: z.string().min(1),
});

export type CreateOrgValues = z.infer<typeof createOrgSchema>;
