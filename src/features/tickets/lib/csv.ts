/**
 * A small RFC 4180 CSV reader.
 *
 * Hand-written rather than a dependency: the import screen needs quoted fields, embedded
 * commas, escaped quotes and mixed line endings, and nothing else — no streaming, no type
 * inference, no dialect sniffing. That is about sixty lines, and it keeps the "no new npm
 * packages" line intact.
 *
 * `String.split(",")` is the trap this exists to avoid: real exports quote any subject
 * containing a comma, and splitting naively shears those rows into the wrong columns
 * silently, which is worse than failing.
 */

/** The delimiter, quote and newline handling that RFC 4180 actually specifies. */
export function parseCsv(input: string): string[][] {
  // Strip a UTF-8 BOM — Excel writes one, and it otherwise becomes part of the first header
  // name, so "Subject" never matches and the whole mapping step looks broken.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };

  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        // `""` inside a quoted field is one literal quote; a lone `"` closes the field.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }

        quoted = false;
        i += 1;
        continue;
      }

      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      endField();
      i += 1;
      continue;
    }

    if (char === "\r") {
      // Swallow CRLF as one break; a bare CR is an old-Mac line ending and breaks too.
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }

    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // A file not ending in a newline still has a final row; one that does must not gain a
  // spurious empty one.
  if (field !== "" || row.length > 0) {
    endRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0]!.trim() === ""));
}

/** Header row plus the rest, which is how every consumer here wants it. */
export type CsvTable = {
  headers: string[];
  rows: string[][];
};

export function readCsvTable(input: string): CsvTable {
  const parsed = parseCsv(input);

  if (parsed.length === 0) {
    return { headers: [], rows: [] };
  }

  return {
    headers: (parsed[0] ?? []).map((h) => h.trim()),
    rows: parsed.slice(1),
  };
}

/**
 * Guess which ticket field each column holds, so the mapping step opens with the obvious
 * answers already filled in rather than seven "— skip —"s.
 *
 * Matching is on a squashed form of the header ("Requester email", "requester_email" and
 * "REQUESTER EMAIL" all collapse to "requesteremail"), because no two helpdesk exports
 * spell their headers the same way.
 */
const HEADER_HINTS: Record<string, readonly string[]> = {
  legacyId: ["ticketid", "id", "ticket", "number", "ticketnumber", "reference", "ref", "key"],
  subject: ["subject", "title", "summary", "name"],
  requesterEmail: ["requesteremail", "requester", "email", "contactemail", "customeremail", "from"],
  company: ["company", "organisation", "organization", "account", "customer"],
  priority: ["priority", "severity", "urgency"],
  status: ["status", "state"],
  createdAt: ["createdat", "created", "opened", "date", "createddate", "openedat"],
};

export type CsvFieldName = keyof typeof HEADER_HINTS;

export const CSV_FIELDS: readonly CsvFieldName[] = [
  "legacyId",
  "subject",
  "requesterEmail",
  "company",
  "priority",
  "status",
  "createdAt",
];

/** Human labels for the mapping selects. */
export const CSV_FIELD_LABELS: Record<CsvFieldName, string> = {
  legacyId: "Legacy ID",
  subject: "Subject",
  requesterEmail: "Requester email",
  company: "Company",
  priority: "Priority",
  status: "Status",
  createdAt: "Created at",
};

const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * `headers[i]` → field name, or null for "skip". Each field is claimed at most once: two
 * columns both guessing `subject` would silently make the second one win.
 */
export function guessMapping(headers: string[]): (CsvFieldName | null)[] {
  const taken = new Set<CsvFieldName>();

  return headers.map((header) => {
    const key = squash(header);

    for (const field of CSV_FIELDS) {
      if (taken.has(field)) continue;

      if (HEADER_HINTS[field]!.includes(key)) {
        taken.add(field);
        return field;
      }
    }

    return null;
  });
}
