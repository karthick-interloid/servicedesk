import type { TicketPriority, TicketStatus } from "@/lib/badge-tones";

import { EMAIL_PATTERN } from "@/features/auth/schemas/email";

import type { CsvFieldName } from "./csv";

/**
 * Turning mapped CSV columns into candidate tickets — pure, so the rules below are testable
 * without a database, and so the review step and the actual import cannot disagree about
 * what a row means. The service calls exactly this and then inserts what it returns.
 */

/** One row that will become a ticket. */
export type CsvCandidate = {
  /** 1-based row number in the file, header excluded — what the user sees in a spreadsheet. */
  line: number;
  legacyId: string | null;
  subject: string;
  requesterEmail: string;
  company: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string | null;
  /** True when the file asked for a live status and it was clamped — see `IMPORT_STATUS`. */
  statusClamped: boolean;
};

export type CsvSkip = {
  line: number;
  reason: string;
};

export type CsvNormalizeResult = {
  candidates: CsvCandidate[];
  skipped: CsvSkip[];
};

/**
 * Imported tickets land terminal.
 *
 * The design states the rule outright — *"Imported tickets arrive as Solved so they don't
 * enter live SLA clocks."* Historical rows dropped into an open status would each start a
 * resolution clock against a `created_at` from years ago and breach on arrival, which would
 * show up as thousands of red pills across the queue the moment an import finished.
 */
const IMPORT_STATUS: TicketStatus = "resolved";

/** The two statuses that carry no running clock, so a file may keep its own value. */
const TERMINAL_STATUSES = new Set<TicketStatus>(["resolved", "closed"]);

const PRIORITY_ALIASES: Record<string, TicketPriority> = {
  urgent: "urgent",
  critical: "urgent",
  p1: "urgent",
  high: "high",
  p2: "high",
  normal: "normal",
  medium: "normal",
  standard: "normal",
  p3: "normal",
  low: "low",
  minor: "low",
  p4: "low",
};

const STATUS_ALIASES: Record<string, TicketStatus> = {
  new: "new",
  open: "open",
  active: "open",
  pending: "pending",
  waiting: "pending",
  onhold: "on_hold",
  on_hold: "on_hold",
  hold: "on_hold",
  resolved: "resolved",
  solved: "resolved",
  done: "resolved",
  complete: "resolved",
  completed: "resolved",
  closed: "closed",
  archived: "closed",
};

const key = (value: string) => value.trim().toLowerCase().replace(/[\s-]/g, "");

/**
 * Accepts what exports actually emit: ISO 8601, and `YYYY-MM-DD`. Anything else is dropped
 * rather than guessed — `03/04/2024` is two different days depending on which side of the
 * Atlantic wrote it, and silently picking one would misdate every imported ticket.
 */
function parseTimestamp(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(trimmed)) return null;

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/**
 * Apply the column mapping to every row and sort them into importable and skipped.
 *
 * A row is skipped, never guessed at, when it has no subject or no usable requester email:
 * `tickets.subject` is NOT NULL and `requester_customer_id` is a NOT NULL FK, so there is
 * no such thing as a partial ticket. The design's review step reports exactly this
 * ("2 rows skipped (missing requester)").
 */
export function normalizeCsvRows(
  rows: string[][],
  mapping: (CsvFieldName | null)[],
): CsvNormalizeResult {
  const columnOf = (field: CsvFieldName) => mapping.indexOf(field);

  const subjectCol = columnOf("subject");
  const emailCol = columnOf("requesterEmail");
  const legacyCol = columnOf("legacyId");
  const companyCol = columnOf("company");
  const priorityCol = columnOf("priority");
  const statusCol = columnOf("status");
  const createdCol = columnOf("createdAt");

  const cell = (row: string[], index: number) => (index < 0 ? "" : (row[index] ?? "").trim());

  const candidates: CsvCandidate[] = [];
  const skipped: CsvSkip[] = [];

  rows.forEach((row, index) => {
    const line = index + 1;

    // A trailing blank line is not a failed row — it is nothing at all.
    if (row.every((value) => value.trim() === "")) return;

    const subject = cell(row, subjectCol);
    const requesterEmail = cell(row, emailCol).toLowerCase();

    if (!subject) {
      skipped.push({ line, reason: "missing subject" });
      return;
    }

    if (!requesterEmail) {
      skipped.push({ line, reason: "missing requester" });
      return;
    }

    if (!EMAIL_PATTERN.test(requesterEmail)) {
      skipped.push({ line, reason: `requester "${requesterEmail}" is not an email address` });
      return;
    }

    const rawStatus = cell(row, statusCol);
    const mappedStatus = STATUS_ALIASES[key(rawStatus)];
    const keepsOwnStatus = mappedStatus !== undefined && TERMINAL_STATUSES.has(mappedStatus);

    candidates.push({
      line,
      legacyId: cell(row, legacyCol) || null,
      subject: subject.slice(0, 200),
      requesterEmail,
      company: cell(row, companyCol) || null,
      priority: PRIORITY_ALIASES[key(cell(row, priorityCol))] ?? "normal",
      status: keepsOwnStatus ? mappedStatus : IMPORT_STATUS,
      createdAt: parseTimestamp(cell(row, createdCol)),
      statusClamped: rawStatus !== "" && !keepsOwnStatus,
    });
  });

  return { candidates, skipped };
}

/**
 * `tickets.description` is NOT NULL and a CSV rarely carries the body, so the row's own
 * provenance becomes the description. The legacy identifier has nowhere else to live —
 * there is no column for it — and losing it would make an imported ticket impossible to
 * trace back to the system it came from.
 */
export function importedDescription(candidate: CsvCandidate): string {
  const origin = candidate.legacyId
    ? `Imported from CSV (original reference ${candidate.legacyId}).`
    : "Imported from CSV.";

  return `${candidate.subject}\n\n${origin}`;
}
