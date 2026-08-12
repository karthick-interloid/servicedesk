import { describe, expect, it } from "vitest";

import {
  guessMapping,
  parseCsv,
  readCsvTable,
  type CsvFieldName,
} from "@/features/tickets/lib/csv";
import { importedDescription, normalizeCsvRows } from "@/features/tickets/lib/csv-rows";

/**
 * The import path's rules live in these two pure modules precisely so they can be tested
 * without a database — and so the review step the user approves and the insert that follows
 * cannot disagree, because they call the same functions.
 */

describe("parseCsv", () => {
  it("reads a plain file", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  /* The reason this is not `String.split(",")`: real exports quote any subject containing a
     comma, and a naive split shears those rows into the wrong columns silently. */
  it("keeps a quoted field containing a comma in one piece", () => {
    expect(parseCsv('id,subject\n1,"Cannot log in, then it crashes"')).toEqual([
      ["id", "subject"],
      ["1", "Cannot log in, then it crashes"],
    ]);
  });

  it("unescapes a doubled quote", () => {
    expect(parseCsv('subject\n"He said ""no"" twice"')).toEqual([
      ["subject"],
      ['He said "no" twice'],
    ]);
  });

  it("keeps newlines inside a quoted field", () => {
    expect(parseCsv('subject\n"line one\nline two"')).toEqual([
      ["subject"],
      ["line one\nline two"],
    ]);
  });

  it("handles CRLF, bare CR and a missing trailing newline", () => {
    expect(parseCsv("a\r\n1\r\n2")).toEqual([["a"], ["1"], ["2"]]);
    expect(parseCsv("a\r1")).toEqual([["a"], ["1"]]);
  });

  it("does not invent a row for a trailing newline", () => {
    expect(parseCsv("a,b\n1,2\n")).toHaveLength(2);
  });

  it("strips the BOM Excel writes, so the first header still matches", () => {
    const { headers } = readCsvTable("﻿Subject,Requester email\nx,y@z.com");
    expect(headers[0]).toBe("Subject");
  });

  it("preserves empty trailing fields", () => {
    expect(parseCsv("a,b,c\n1,,3")).toEqual([
      ["a", "b", "c"],
      ["1", "", "3"],
    ]);
  });
});

describe("guessMapping", () => {
  it("matches the design's own template headers", () => {
    expect(
      guessMapping([
        "Ticket ID",
        "Subject",
        "Requester email",
        "Company",
        "Priority",
        "Status",
        "Created at",
      ]),
    ).toEqual([
      "legacyId",
      "subject",
      "requesterEmail",
      "company",
      "priority",
      "status",
      "createdAt",
    ]);
  });

  it("ignores case, spacing and punctuation between exports", () => {
    expect(guessMapping(["requester_email", "SUBJECT"])).toEqual(["requesterEmail", "subject"]);
  });

  it("claims each field once, so a second candidate column does not silently win", () => {
    const mapping = guessMapping(["Subject", "Title"]);
    expect(mapping[0]).toBe("subject");
    expect(mapping[1]).toBeNull();
  });

  it("skips columns it does not recognise", () => {
    expect(guessMapping(["Subject", "Sprint velocity"])[1]).toBeNull();
  });
});

describe("normalizeCsvRows", () => {
  const mapping: (CsvFieldName | null)[] = [
    "legacyId",
    "subject",
    "requesterEmail",
    "company",
    "priority",
    "status",
    "createdAt",
  ];

  const row = (over: Record<number, string> = {}) => {
    const base = [
      "LEG-1",
      "Invoice mismatch",
      "dana@meridian.com",
      "Meridian",
      "High",
      "Solved",
      "2026-03-04",
    ];
    for (const [index, value] of Object.entries(over)) base[Number(index)] = value;
    return base;
  };

  it("maps a well-formed row", () => {
    const { candidates } = normalizeCsvRows([row()], mapping);

    expect(candidates[0]).toMatchObject({
      line: 1,
      legacyId: "LEG-1",
      subject: "Invoice mismatch",
      requesterEmail: "dana@meridian.com",
      company: "Meridian",
      priority: "high",
      status: "resolved",
    });
  });

  it("lower-cases the requester email so the citext lookup matches", () => {
    const { candidates } = normalizeCsvRows([row({ 2: "Dana@Meridian.com" })], mapping);
    expect(candidates[0]!.requesterEmail).toBe("dana@meridian.com");
  });

  /* Both columns back NOT NULL fields (`subject`, and the `requester_customer_id` FK), so
     there is no such thing as a partial ticket — the row is reported, never guessed at. */
  it("skips a row with no subject, and says why", () => {
    const { candidates, skipped } = normalizeCsvRows([row({ 1: "" })], mapping);
    expect(candidates).toHaveLength(0);
    expect(skipped[0]).toEqual({ line: 1, reason: "missing subject" });
  });

  it("skips a row with no requester", () => {
    const { skipped } = normalizeCsvRows([row({ 2: "" })], mapping);
    expect(skipped[0]).toEqual({ line: 1, reason: "missing requester" });
  });

  it("skips a requester that is not an address", () => {
    const { skipped } = normalizeCsvRows([row({ 2: "not-an-email" })], mapping);
    expect(skipped[0]!.reason).toContain("not an email address");
  });

  it("ignores a blank trailing line rather than reporting it as a failure", () => {
    const { candidates, skipped } = normalizeCsvRows(
      [row(), ["", "", "", "", "", "", ""]],
      mapping,
    );
    expect(candidates).toHaveLength(1);
    expect(skipped).toHaveLength(0);
  });

  /* The design's rule, verbatim: "Imported tickets arrive as Solved so they don't enter
     live SLA clocks." A live status would start a resolution clock against a created_at
     from years ago and breach on arrival. */
  it("clamps a live status to resolved and flags it", () => {
    const { candidates } = normalizeCsvRows([row({ 5: "Open" })], mapping);
    expect(candidates[0]).toMatchObject({ status: "resolved", statusClamped: true });
  });

  it("lets a terminal status through unclamped", () => {
    const { candidates } = normalizeCsvRows([row({ 5: "Closed" })], mapping);
    expect(candidates[0]).toMatchObject({ status: "closed", statusClamped: false });
  });

  it("does not flag a clamp when the file had no status at all", () => {
    const { candidates } = normalizeCsvRows([row({ 5: "" })], mapping);
    expect(candidates[0]).toMatchObject({ status: "resolved", statusClamped: false });
  });

  it("understands the priority spellings other helpdesks use", () => {
    const of = (value: string) =>
      normalizeCsvRows([row({ 4: value })], mapping).candidates[0]!.priority;

    expect(of("P1")).toBe("urgent");
    expect(of("critical")).toBe("urgent");
    expect(of("Medium")).toBe("normal");
    expect(of("minor")).toBe("low");
  });

  it("falls back to normal for a priority it cannot read", () => {
    expect(normalizeCsvRows([row({ 4: "spicy" })], mapping).candidates[0]!.priority).toBe("normal");
  });

  /* `03/04/2024` is two different days depending on who wrote it. Guessing would misdate
     every imported ticket, so an unreadable date is dropped and `created_at` defaults. */
  it("takes ISO dates and drops ambiguous ones", () => {
    const at = (value: string) =>
      normalizeCsvRows([row({ 6: value })], mapping).candidates[0]!.createdAt;

    expect(at("2026-03-04")).toBe("2026-03-04T00:00:00.000Z");
    expect(at("03/04/2026")).toBeNull();
    expect(at("last Tuesday")).toBeNull();
  });

  it("numbers rows the way a spreadsheet does, header excluded", () => {
    const { candidates } = normalizeCsvRows([row(), row({ 0: "LEG-2" })], mapping);
    expect(candidates.map((c) => c.line)).toEqual([1, 2]);
  });

  it("survives a mapping that skips every optional column", () => {
    const minimal: (CsvFieldName | null)[] = [
      null,
      "subject",
      "requesterEmail",
      null,
      null,
      null,
      null,
    ];
    const { candidates } = normalizeCsvRows([row()], minimal);

    expect(candidates[0]).toMatchObject({
      legacyId: null,
      company: null,
      priority: "normal",
      status: "resolved",
      createdAt: null,
    });
  });
});

describe("importedDescription", () => {
  /* `tickets.description` is NOT NULL and a CSV rarely carries a body, and the legacy id has
     no column of its own — losing it would make an imported ticket untraceable. */
  it("keeps the legacy reference when there is one", () => {
    const text = importedDescription({
      line: 1,
      legacyId: "LEG-8841",
      subject: "Invoice mismatch",
      requesterEmail: "d@e.com",
      company: null,
      priority: "normal",
      status: "resolved",
      createdAt: null,
      statusClamped: false,
    });

    expect(text).toContain("Invoice mismatch");
    expect(text).toContain("LEG-8841");
  });

  it("still produces a body when there is no legacy id", () => {
    const text = importedDescription({
      line: 1,
      legacyId: null,
      subject: "Invoice mismatch",
      requesterEmail: "d@e.com",
      company: null,
      priority: "normal",
      status: "resolved",
      createdAt: null,
      statusClamped: false,
    });

    expect(text.trim()).not.toBe("");
    expect(text).toContain("Imported from CSV.");
  });
});
