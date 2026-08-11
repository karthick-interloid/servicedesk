import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { guessMapping, readCsvTable, type CsvFieldName } from "@/features/tickets/lib/csv";
import {
  importedDescription,
  normalizeCsvRows,
  type CsvCandidate,
} from "@/features/tickets/lib/csv-rows";

import { TicketError } from "./ticket.service";

/**
 * CSV import — parse, resolve requesters, insert.
 *
 * ⚠ SERVER ONLY, same as `ticket.service.ts`.
 *
 * The parsing and row rules live in `lib/csv.ts` and `lib/csv-rows.ts` as pure functions, so
 * the review step the user approves and the import that follows run *the same code* over the
 * same bytes. A preview that re-implements the rules is a preview that lies.
 */

/** What the review step shows before anything is written. */
export type ImportPreview = {
  headers: string[];
  /** `headers[i]` → ticket field, or null to skip. */
  mapping: (CsvFieldName | null)[];
  totalRows: number;
  ready: number;
  /** Rows that cannot become tickets, with the reason the design's summary quotes. */
  skipped: { line: number; reason: string }[];
  /** Rows whose live status was clamped to `resolved` — see `csv-rows.ts`. */
  clamped: number;
  /** Requester addresses with no matching customer. These rows cannot be imported. */
  unknownRequesters: string[];
  /** First few importable rows, for the preview table. */
  sample: CsvCandidate[];
};

export type ImportResult = {
  imported: number;
  skipped: number;
};

/** Guard-rail from the design's own copy: "Up to 50,000 rows per file." */
export const MAX_IMPORT_ROWS = 50_000;

/**
 * Postgres will take far more than this in one statement, but a single 50,000-row insert is
 * one all-or-nothing round trip that also has to be serialised into memory twice. Chunking
 * keeps each request small and means a failure late in a large file leaves the earlier
 * chunks committed rather than discarding an hour of work.
 */
const INSERT_CHUNK = 500;

/**
 * Read the file and report what would happen, writing nothing.
 *
 * `unknownRequesters` is the expensive part and the reason preview is a server round trip
 * rather than pure client work: whether a row is importable depends on whether a customer
 * with that address exists in *this* tenant, which only the database knows.
 */
export async function previewImport(
  csv: string,
  overrideMapping?: (CsvFieldName | null)[],
): Promise<ImportPreview> {
  const supabase = await createSupabaseServerClient();

  const { headers, rows, mapping } = parseWithMapping(csv, overrideMapping);
  const { candidates, skipped } = normalizeCsvRows(rows, mapping);

  const known = await resolveRequesters(supabase, candidates);

  const unknownRequesters = [
    ...new Set(candidates.filter((c) => !known.has(c.requesterEmail)).map((c) => c.requesterEmail)),
  ];

  const importable = candidates.filter((c) => known.has(c.requesterEmail));

  return {
    headers,
    mapping,
    totalRows: rows.length,
    ready: importable.length,
    skipped: [
      ...skipped,
      ...candidates
        .filter((c) => !known.has(c.requesterEmail))
        .map((c) => ({ line: c.line, reason: `no customer with email ${c.requesterEmail}` })),
    ].sort((a, b) => a.line - b.line),
    clamped: importable.filter((c) => c.statusClamped).length,
    unknownRequesters,
    sample: importable.slice(0, 5),
  };
}

/**
 * Do the import.
 *
 * Re-parses from the file rather than trusting a client-sent row list: the review step ran
 * server-side, but the button that follows it is a Server Action, and an action is a public
 * endpoint. The bytes are the input; everything else is derived here.
 */
export async function importTickets(
  csv: string,
  overrideMapping?: (CsvFieldName | null)[],
): Promise<ImportResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new TicketError("Sign in to import tickets.", { status: 401, code: "unauthenticated" });
  }

  const { data: claims } = await supabase.auth.getClaims();
  const tenantId = claims?.claims?.tenant_id as string | undefined;

  if (!tenantId) {
    throw new TicketError("Your account isn't attached to an organization yet.", {
      status: 403,
      code: "forbidden",
    });
  }

  const { rows, mapping } = parseWithMapping(csv, overrideMapping);
  const { candidates, skipped } = normalizeCsvRows(rows, mapping);

  const known = await resolveRequesters(supabase, candidates);
  const importable = candidates.filter((c) => known.has(c.requesterEmail));

  if (importable.length === 0) {
    throw new TicketError(
      "Nothing in that file could be imported — no row matched a customer in your organization.",
      { status: 422, code: "validation" },
    );
  }

  await backfillCompanies(supabase, importable, known);

  let imported = 0;

  for (let start = 0; start < importable.length; start += INSERT_CHUNK) {
    const chunk = importable.slice(start, start + INSERT_CHUNK);

    const { error } = await supabase.from("tickets").insert(
      chunk.map((candidate) => ({
        tenant_id: tenantId,
        // `number` is omitted on purpose — `set_tickets_number` assigns one per row inside
        // the insert's own transaction, so a 500-row chunk still gets 500 distinct numbers.
        subject: candidate.subject,
        description: importedDescription(candidate),
        status: candidate.status,
        priority: candidate.priority,
        requester_customer_id: known.get(candidate.requesterEmail)!.id,
        // Imported tickets carry no `sla_events` row at all. That is what actually keeps
        // them out of live SLA clocks; the terminal status is the visible half of the rule.
        ...(candidate.createdAt ? { created_at: candidate.createdAt } : {}),
        ...(candidate.status === "resolved" || candidate.status === "closed"
          ? { resolved_at: candidate.createdAt ?? new Date().toISOString() }
          : {}),
      })),
    );

    if (error) {
      throw new TicketError(
        error.code === "42501"
          ? "You don't have permission to import tickets here."
          : `Import stopped after ${imported} tickets: ${error.message}`,
        {
          status: error.code === "42501" ? 403 : 500,
          code: error.code === "42501" ? "forbidden" : "unknown",
        },
      );
    }

    imported += chunk.length;
  }

  return { imported, skipped: skipped.length + (candidates.length - importable.length) };
}

/* -------------------------------------------------------------------------- */

function parseWithMapping(csv: string, overrideMapping?: (CsvFieldName | null)[]) {
  const { headers, rows } = readCsvTable(csv);

  if (headers.length === 0) {
    throw new TicketError("That file has no header row.", { status: 422, code: "validation" });
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new TicketError(
      `That file has ${rows.length.toLocaleString()} rows. The limit is ${MAX_IMPORT_ROWS.toLocaleString()}.`,
      { status: 422, code: "validation" },
    );
  }

  // A mapping from the client is a claim about the file, so it is only honoured when it
  // describes the file we actually parsed.
  const mapping =
    overrideMapping && overrideMapping.length === headers.length
      ? overrideMapping
      : guessMapping(headers);

  if (!mapping.includes("subject") || !mapping.includes("requesterEmail")) {
    throw new TicketError(
      "Map a Subject column and a Requester email column before importing — a ticket needs both.",
      { status: 422, code: "validation" },
    );
  }

  return { headers, rows, mapping };
}

/**
 * email → customer, for every address the file mentions.
 *
 * `customers.email` is `citext` and unique per tenant, so a case-insensitive match is exact
 * rather than a heuristic. Chunked because `.in()` builds a URL and a 50,000-address filter
 * would not survive one.
 */
async function resolveRequesters(supabase: SupabaseClient, candidates: CsvCandidate[]) {
  const emails = [...new Set(candidates.map((c) => c.requesterEmail))];
  const found = new Map<string, { id: string; company: string | null }>();

  for (let start = 0; start < emails.length; start += INSERT_CHUNK) {
    const chunk = emails.slice(start, start + INSERT_CHUNK);

    const { data, error } = await supabase
      .from("customers")
      .select("id, email, company")
      .in("email", chunk);

    if (error) {
      throw new TicketError("We couldn't match the requesters in that file.", {
        status: 500,
        code: "unknown",
      });
    }

    for (const row of data ?? []) {
      found.set(String(row.email).toLowerCase(), { id: row.id, company: row.company });
    }
  }

  return found;
}

/**
 * Fill in `customers.company` from the file where we don't have one.
 *
 * Only ever fills a blank — an import must not rename a company an operator has already set,
 * and a stale export is exactly the sort of file that would try to.
 */
async function backfillCompanies(
  supabase: SupabaseClient,
  candidates: CsvCandidate[],
  known: Map<string, { id: string; company: string | null }>,
) {
  const updates = new Map<string, string>();

  for (const candidate of candidates) {
    const customer = known.get(candidate.requesterEmail);

    if (candidate.company && customer && !customer.company && !updates.has(customer.id)) {
      updates.set(customer.id, candidate.company);
    }
  }

  for (const [id, company] of updates) {
    const { error } = await supabase.from("customers").update({ company }).eq("id", id);

    // `customers_update` is tenant_admin/manager only, so an agent importing a file simply
    // does not back-fill. That is a permissions boundary working, not an import failure.
    if (error && process.env.NODE_ENV !== "production") {
      console.warn(`[tickets] company back-fill skipped for ${id}: ${error.message}`);
    }
  }
}
