/** Display helpers shared by the customers list and the customer record. */

/** `c.initials` in the design: first letter of each word, capped at two. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * `cust.since` in the design, which renders "Customer since Mar 2024".
 *
 * Formatted in UTC with a fixed locale so the server and client agree — the record is a
 * Server Component and a locale-dependent month name would hydrate differently.
 */
export function customerSince(isoDate: string): string {
  // en-US, not en-GB: en-GB abbreviates September as "Sept", which breaks the uniform
  // three-letter run the design shows ("Mar 2024").
  const formatted = new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `Customer since ${formatted}`;
}
