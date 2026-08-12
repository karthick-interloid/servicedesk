import { describe, expect, it } from "vitest";

import {
  AT_RISK_WINDOW_MS,
  byUpdatedDesc,
  formatDuration,
  formatSla,
  formatUpdated,
} from "@/features/tickets/lib/queue-format";
import { MOCK_TICKETS, QUEUE_NOW } from "@/features/tickets/lib/mock-tickets";
import { SOLVED_STATUSES } from "@/features/tickets/types";
import { slaStateTone, ticketPriorityTone, ticketStatusTone } from "@/lib/badge-tones";
import type { QueueSlaEvent, QueueTicket } from "@/features/tickets/types";

const NOW = Date.parse("2026-08-10T14:00:00.000Z");
const at = (ms: number) => new Date(NOW + ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

describe("formatDuration", () => {
  it("renders the design's two-unit strings", () => {
    expect(formatDuration(22 * MIN)).toBe("22m");
    expect(formatDuration(HOUR + 12 * MIN)).toBe("1h 12m");
    expect(formatDuration(3 * 24 * HOUR + 4 * HOUR)).toBe("3d 4h");
  });

  it("drops a zero second unit rather than printing '2h 0m'", () => {
    expect(formatDuration(2 * HOUR)).toBe("2h");
    expect(formatDuration(2 * 24 * HOUR)).toBe("2d");
  });

  it("never goes negative", () => {
    expect(formatDuration(-5 * MIN)).toBe("0m");
  });
});

describe("formatSla", () => {
  const pending = (dueIn: number): QueueSlaEvent => ({
    type: "resolution",
    status: "pending",
    dueAt: at(dueIn),
    completedAt: null,
    breachedAt: null,
  });

  it("splits pending at the 2-hour at-risk window", () => {
    expect(formatSla(pending(AT_RISK_WINDOW_MS - MIN), NOW, at(-HOUR))?.state).toBe("at_risk");
    expect(formatSla(pending(AT_RISK_WINDOW_MS + MIN), NOW, at(-HOUR))?.state).toBe("on_track");
  });

  it("labels a running clock as 'n left'", () => {
    expect(formatSla(pending(22 * MIN), NOW, at(-HOUR))?.label).toBe("22m left");
  });

  it("treats a pending row whose due date has passed as breached", () => {
    const sla = formatSla(pending(-26 * MIN), NOW, at(-HOUR));
    expect(sla).toEqual({ state: "breached", label: "Breached 26m" });
  });

  it("measures 'Met in' from the ticket's created_at, not from due_at", () => {
    const sla = formatSla(
      {
        type: "resolution",
        status: "completed",
        dueAt: at(-2 * HOUR),
        completedAt: at(-3 * HOUR),
        breachedAt: null,
      },
      NOW,
      at(-4 * HOUR - 12 * MIN),
    );
    expect(sla).toEqual({ state: "met", label: "Met in 1h 12m" });
  });

  it("returns null when no SLA policy governs the ticket", () => {
    expect(formatSla(null, NOW, at(-HOUR))).toBeNull();
  });
});

describe("formatUpdated", () => {
  it("uses the design's relative vocabulary", () => {
    expect(formatUpdated(at(-2 * MIN), NOW)).toBe("2 min ago");
    expect(formatUpdated(at(-HOUR), NOW)).toBe("1 hr ago");
    expect(formatUpdated(at(-24 * HOUR), NOW)).toBe("Yesterday");
    expect(formatUpdated(at(-3 * 24 * HOUR), NOW)).toBe("3 days ago");
  });

  it("never renders '0 min ago'", () => {
    expect(formatUpdated(at(0), NOW)).toBe("1 min ago");
  });
});

describe("mock data", () => {
  const sla = (t: QueueTicket) => formatSla(t.slaEvent, QUEUE_NOW, t.createdAt);

  it("covers every ticket status, so every status tone renders", () => {
    const seen = new Set(MOCK_TICKETS.map((t) => t.status));
    expect([...seen].sort()).toEqual(Object.keys(ticketStatusTone).sort());
  });

  it("covers every priority, so every priority tone renders", () => {
    const seen = new Set(MOCK_TICKETS.map((t) => t.priority));
    expect([...seen].sort()).toEqual(Object.keys(ticketPriorityTone).sort());
  });

  it("covers every SLA state", () => {
    const seen = new Set(MOCK_TICKETS.map((t) => sla(t)?.state));
    expect([...seen].sort()).toEqual(Object.keys(slaStateTone).sort());
  });

  it("includes unassigned rows and subjects long enough to truncate", () => {
    expect(MOCK_TICKETS.filter((t) => t.assignee === null).length).toBeGreaterThanOrEqual(2);
    expect(MOCK_TICKETS.filter((t) => t.subject.length > 60).length).toBeGreaterThanOrEqual(2);
  });

  it("reproduces the design capture's first page, newest first", () => {
    const openRows = MOCK_TICKETS.filter((t) => !SOLVED_STATUSES.includes(t.status)).sort(
      byUpdatedDesc,
    );
    expect(openRows.slice(0, 8).map((t) => t.number)).toEqual([
      4823, 4822, 4821, 4819, 4818, 4817, 4816, 4814,
    ]);
  });

  it("renders the capture's SLA strings for that first page", () => {
    const byNumber = (n: number) => MOCK_TICKETS.find((t) => t.number === n)!;
    expect(sla(byNumber(4823))?.label).toBe("22m left");
    expect(sla(byNumber(4821))?.label).toBe("1h 12m left");
    expect(sla(byNumber(4819))?.label).toBe("Breached 26m");
    expect(sla(byNumber(4816))?.label).toBe("6h 40m left");
    expect(sla(byNumber(4814))?.label).toBe("3d 4h left");
  });

  it("keeps `resolved` and `closed` out of the open views", () => {
    const open = MOCK_TICKETS.filter((t) => !SOLVED_STATUSES.includes(t.status));
    expect(open).toHaveLength(13);
    expect(MOCK_TICKETS.length - open.length).toBe(2);
  });
});

describe("badge tones", () => {
  it("maps `new` to brand — treatments.md T8, resolved in favour of the prototype", () => {
    expect(ticketStatusTone.new).toBe("brand");
  });

  it("gives the two statuses the design does not name a derived neutral", () => {
    expect(ticketStatusTone.on_hold).toBe("neutral");
    expect(ticketStatusTone.closed).toBe("neutral");
  });

  it("keeps every tone distinct from the priority ramp where the design says so", () => {
    expect(ticketPriorityTone).toEqual({
      urgent: "error",
      high: "warning",
      normal: "info",
      low: "neutral",
    });
  });
});
