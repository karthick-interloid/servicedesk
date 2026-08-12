import type { QueueSla, QueueSlaEvent, QueueTicket } from "../types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The window inside which a still-pending SLA reads `at_risk` rather than `on_track`.
 * Measured off the design's own rows: "1h 12m left" and "48m left" render amber, "6h 40m
 * left" and "3d 4h left" render green — so the boundary sits between 1h12m and 6h40m.
 * Two hours is the round number in that gap and the usual first-response default.
 */
export const AT_RISK_WINDOW_MS = 2 * HOUR;

/**
 * Two-unit countdown, matching the design's strings exactly: "22m", "1h 12m", "3d 4h".
 * The second unit is dropped when it is zero ("2h", not "2h 0m").
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / MINUTE));
  const days = Math.floor(total / (24 * 60));
  const hours = Math.floor((total % (24 * 60)) / 60);
  const minutes = total % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

/**
 * `sla_events` row → the pill the SLA column renders. Pure, and takes `now` explicitly so
 * server and client agree on the string — a live `Date.now()` here would hydrate mismatched.
 *
 * `openedAt` is the ticket's `created_at`; "Met in 1h 12m" measures completion from there,
 * which is what the SLA clock actually runs against.
 */
export function formatSla(
  event: QueueSlaEvent | null,
  now: number,
  openedAt: string,
): QueueSla | null {
  if (!event) return null;

  if (event.status === "completed") {
    if (!event.completedAt) return { state: "met", label: "Met" };
    return {
      state: "met",
      label: `Met in ${formatDuration(Date.parse(event.completedAt) - Date.parse(openedAt))}`,
    };
  }

  if (event.status === "breached") {
    const since = event.breachedAt ? Date.parse(event.breachedAt) : Date.parse(event.dueAt);
    return { state: "breached", label: `Breached ${formatDuration(now - since)}` };
  }

  const remaining = Date.parse(event.dueAt) - now;
  if (remaining <= 0) return { state: "breached", label: `Breached ${formatDuration(-remaining)}` };
  return {
    state: remaining <= AT_RISK_WINDOW_MS ? "at_risk" : "on_track",
    label: `${formatDuration(remaining)} left`,
  };
}

/**
 * `updated_at` → the relative stamp on the mobile card. The design's vocabulary: "2 min
 * ago", "1 hr ago", "Yesterday", "3 days ago".
 */
export function formatUpdated(iso: string, now: number): string {
  const elapsed = Math.max(0, now - Date.parse(iso));

  if (elapsed < HOUR) {
    const minutes = Math.max(1, Math.round(elapsed / MINUTE));
    return `${minutes} min ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.round(elapsed / HOUR);
    return `${hours} hr ago`;
  }
  const days = Math.round(elapsed / DAY);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

/** Newest first. The queue's default order, and what the "Subject ↓" caret reports. */
export function byUpdatedDesc(a: QueueTicket, b: QueueTicket): number {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}
