"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, CircleAlert, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { importTicketsAction, previewImportAction } from "../actions";
import {
  CSV_FIELDS,
  CSV_FIELD_LABELS,
  guessMapping,
  readCsvTable,
  type CsvFieldName,
} from "../lib/csv";
import type { ImportPreview } from "../services/csv-import";

const STEPS = ["Upload file", "Map columns", "Review"] as const;

const SKIP = "__skip__";

/**
 * `/tickets/import` — the design's three-step wizard, wired.
 *
 * The file never leaves the browser until the user asks for something. Step 1 reads it with
 * `FileReader` and parses the header row locally, purely so the mapping step can be filled
 * in without a round trip; step 2's Continue is the first server call, and it is a dry run.
 *
 * The dry run matters more than it looks. Whether a row is importable depends on whether a
 * customer with that email exists in *this* tenant, which only the database knows — so a
 * preview computed on the client would be a guess, and the counts the user approves have to
 * be the ones the import will actually produce. `previewImportAction` and
 * `importTicketsAction` run the same parser over the same bytes for exactly that reason.
 */
export function CsvImport() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [mapping, setMapping] = useState<(CsvFieldName | null)[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, startWork] = useTransition();
  const [dragging, setDragging] = useState(false);

  async function acceptFile(file: File) {
    setError(null);

    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("That doesn't look like a CSV. Export one from your old helpdesk and try again.");
      return;
    }

    const text = await file.text();
    const table = readCsvTable(text);

    if (table.headers.length === 0) {
      setError("That file has no header row.");
      return;
    }

    setFileName(file.name);
    setCsv(text);
    setHeaders(table.headers);
    setRowCount(table.rows.length);
    // Pre-fill from the header names. The user can override every one of them in step 2.
    setMapping(guessMapping(table.headers));
    setStep(1);
  }

  function runPreview() {
    if (!csv) return;
    setError(null);

    startWork(async () => {
      const result = await previewImportAction(csv, mapping);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setPreview(result.data);
      setStep(2);
    });
  }

  function runImport() {
    if (!csv) return;
    setError(null);

    startWork(async () => {
      const result = await importTicketsAction(csv, mapping);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setImported(result.data.imported);
      // The action revalidated /tickets; refreshing here means the queue is already correct
      // by the time the user follows the link back to it.
      router.refresh();
    });
  }

  const mappedFields = new Set(mapping.filter(Boolean) as CsvFieldName[]);
  const canContinue = mappedFields.has("subject") && mappedFields.has("requesterEmail");

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="quiet" size="sm" className="-ml-2 w-fit text-brand-accent">
        <Link href="/tickets">
          <ChevronLeft className="size-4" aria-hidden />
          Back to queue
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Import tickets</h1>
        <p className="text-sm text-muted-foreground">
          Bring history over from your old helpdesk. Up to 50,000 rows per file.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5 max-w-[520px]" />
        <ol className="flex flex-wrap items-center gap-4">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                index === step ? "font-bold text-foreground" : "font-medium text-muted-foreground",
              )}
            >
              {index < step ? (
                <Check className="size-3.5 text-brand-accent" aria-hidden />
              ) : (
                <span className="font-mono">{index + 1}</span>
              )}
              {label}
            </li>
          ))}
        </ol>
      </div>

      {error ? (
        <Alert tone="error" className="max-w-[860px] rounded-[10px] px-3.5 py-3">
          <CircleAlert className="size-[18px]" aria-hidden />
          <AlertDescription className="text-sm leading-[1.55]">{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-[860px] gap-4 p-5">
        {/* ---- Step 1 · Upload -------------------------------------------- */}
        {step === 0 ? (
          <>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) void acceptFile(file);
              }}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center transition-colors",
                dragging && "border-brand-accent bg-brand-accent/8",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-accent/8 text-brand-accent">
                <Upload className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold">Drop a CSV here</p>
              <p className="max-w-[380px] text-sm text-muted-foreground">
                Or choose a file. We&apos;ll validate the header row before anything is imported.
              </p>

              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void acceptFile(file);
                  // Reset so re-picking the same file after a failed parse still fires.
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="neutral"
                className="min-h-11 md:min-h-10"
                onClick={() => fileInput.current?.click()}
              >
                Choose file
              </Button>
            </div>

            <a
              href="/templates/tickets.csv"
              download
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              Download the template CSV
            </a>
          </>
        ) : null}

        {/* ---- Step 2 · Map columns --------------------------------------- */}
        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">{fileName}</strong> ·{" "}
              {headers.length} columns · {rowCount.toLocaleString()} rows
            </p>

            {headers.map((header, index) => (
              <div
                key={`${header}-${index}`}
                className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)]"
              >
                <span className="truncate font-mono text-xs text-muted-foreground">{header}</span>
                <span className="hidden text-center text-muted-foreground sm:block" aria-hidden>
                  →
                </span>
                <div className="flex flex-col gap-1.5">
                  <Label className="sr-only" htmlFor={`map-${index}`}>
                    {`Map column ${header}`}
                  </Label>
                  <Select
                    value={mapping[index] ?? SKIP}
                    onValueChange={(value) =>
                      setMapping((prev) => {
                        const next = [...prev];
                        const field = value === SKIP ? null : (value as CsvFieldName);

                        // A field can only come from one column. Claiming it here releases
                        // whichever column held it, rather than silently having two.
                        if (field) {
                          const previousHolder = next.indexOf(field);
                          if (previousHolder >= 0) next[previousHolder] = null;
                        }

                        next[index] = field;
                        return next;
                      })
                    }
                  >
                    <SelectTrigger id={`map-${index}`} className="min-h-11 md:min-h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>— skip —</SelectItem>
                      {CSV_FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {CSV_FIELD_LABELS[field]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {!canContinue ? (
              <p className="text-xs text-muted-foreground">
                Map a <strong className="font-semibold">Subject</strong> column and a{" "}
                <strong className="font-semibold">Requester email</strong> column — a ticket needs
                both.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ---- Step 3 · Review -------------------------------------------- */}
        {step === 2 && preview ? (
          <div className="flex flex-col gap-3">
            {imported === null ? (
              <>
                <div className="flex flex-wrap gap-2.5 text-sm">
                  <span className="rounded-md bg-success-soft px-2.5 py-1 font-semibold text-success-strong ring-1 ring-success/25 ring-inset">
                    {preview.ready.toLocaleString()} ready
                  </span>
                  {preview.skipped.length > 0 ? (
                    <span className="rounded-md bg-warning-soft px-2.5 py-1 font-semibold text-warning-strong ring-1 ring-warning/25 ring-inset">
                      {preview.skipped.length.toLocaleString()} rows skipped
                    </span>
                  ) : null}
                  {preview.clamped > 0 ? (
                    <span className="rounded-md bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground ring-1 ring-border ring-inset">
                      {preview.clamped.toLocaleString()} moved to Resolved
                    </span>
                  ) : null}
                </div>

                {preview.skipped.length > 0 ? (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold">
                      Why {preview.skipped.length.toLocaleString()} rows were skipped
                    </summary>
                    <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-muted-foreground">
                      {preview.skipped.slice(0, 50).map((row) => (
                        <li key={row.line}>
                          Row {row.line} — {row.reason}
                        </li>
                      ))}
                      {preview.skipped.length > 50 ? (
                        <li>…and {preview.skipped.length - 50} more.</li>
                      ) : null}
                    </ul>
                  </details>
                ) : null}

                {preview.sample.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          {["Legacy ID", "Subject", "Requester", "Priority"].map((head) => (
                            <TableHead
                              key={head}
                              className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                            >
                              {head}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.sample.map((row) => (
                          <TableRow key={row.line}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {row.legacyId ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{row.subject}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.requesterEmail}
                            </TableCell>
                            <TableCell className="text-sm capitalize">{row.priority}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Imported tickets arrive as Resolved and carry no SLA clock, so historical rows
                  don&apos;t breach the moment they land.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success-strong">
                  <Check className="size-5" aria-hidden />
                </span>
                <h2 className="text-base font-bold">
                  {imported.toLocaleString()} tickets imported
                </h2>
                <p className="max-w-[420px] text-sm text-muted-foreground">
                  They&apos;re in your queue under the Solved view.
                </p>
                <Button
                  asChild
                  className="min-h-11 bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90 md:min-h-10"
                >
                  <Link href="/tickets">Back to queue</Link>
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {/* ---- Wizard controls -------------------------------------------- */}
        {imported === null ? (
          <div className="flex items-center gap-2.5">
            {step > 0 ? (
              <Button
                type="button"
                variant="neutral"
                className="min-h-11 md:min-h-10"
                disabled={isBusy}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : null}

            {step === 1 ? (
              <Button
                type="button"
                disabled={isBusy || !canContinue}
                onClick={runPreview}
                className="ml-auto min-h-11 bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90 md:min-h-10"
              >
                {isBusy ? "Checking…" : "Continue"}
              </Button>
            ) : null}

            {step === 2 && preview ? (
              <Button
                type="button"
                disabled={isBusy || preview.ready === 0}
                onClick={runImport}
                className="ml-auto min-h-11 bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90 md:min-h-10"
              >
                {isBusy
                  ? "Importing…"
                  : `Import ${preview.ready.toLocaleString()} ticket${preview.ready === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
