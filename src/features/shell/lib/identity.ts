/**
 * Placeholder identity for the shell. There is no session yet — replace the whole
 * module with a session lookup when auth lands.
 *
 * The org name is the one the brief specifies ("Interloid"); the plan line, user and
 * role are the design's own seeded values for the Tenant Admin role in
 * `Update design.dc.html` (`renderVals` → `userName` / `userInitials` / `roleLabel`,
 * and the `Pro plan · 6 of 10 seats` line in the sidebar header).
 */
export const ORG = {
  name: "Interloid",
  initial: "I",
  planSummary: "Pro plan · 6 of 10 seats",
} as const;

export const USER = {
  name: "Maya Okonkwo",
  initials: "MO",
  role: "Tenant Admin",
} as const;
