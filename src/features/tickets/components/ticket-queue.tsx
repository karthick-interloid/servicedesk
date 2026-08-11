"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slaStateTone, ticketPriorityTone, ticketStatusTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

import { byUpdatedDesc, formatSla, formatUpdated } from "../lib/queue-format";
import { NewTicketSheet } from "./new-ticket-sheet";
import {
  PRIORITY_LABEL,
  SOLVED_STATUSES,
  STATUS_LABEL,
  type CustomerOption,
  type QueueState,
  type QueueTicket,
  type QueueView,
  type TicketPriority,
  type TicketStatus,
} from "../types";

/* ---------------------------------------------------------------------------
   RESPONSIVE COLUMN GATES — the one deliberate deviation from the capture.

   The design gates requester, assignee AND status on `lg:` (1024). At 1024–1279 all
   eight tracks are therefore live inside a ~716px content box, and the capture shows
   the result: the subject track collapses to 0, the SUBJECT and REQUESTER headers
   overprint each other as "SUBJEREQUESTER", no subject text renders in any row, and
   the SLA column is clipped off the right edge. That is `DESIGN_SUMMARY` ambiguity #3
   and `components-map.md` row 83's ⚠ blocker.

   The fix, per the brief: promote requester and status to `xl:` (1280) so that band
   carries six tracks instead of eight. Assignee stays at `lg:` — it is the narrowest
   of the three and the one an agent triages by. Below `md:` the table is replaced
   wholesale by the card list, matching the design.

       <  768   cards
       768–1023 checkbox · ticket · subject · priority · sla          (design: same)
       1024–1279 + assignee                                           (design: + requester + assignee + status → breaks)
       >= 1280  + requester + status                                  (design: same)
   --------------------------------------------------------------------------- */
const COL_REQUESTER = "hidden xl:table-cell";
const COL_ASSIGNEE = "hidden lg:table-cell";
const COL_STATUS = "hidden xl:table-cell";

/* Fixed tracks, MEASURED off `ticket-queue--light.png` at 1440 (column-start deltas):
   `48 · 89 · 292(flex) · 168 · 103 · 159 · 116 · 151`. The design system documents the
   ladder as `40 · 74 · flex · 158 · 92 · 150 · 104 · 128`, i.e. the same tracks minus
   cell padding — but the two disagree by up to 7px once the padding is added back, and
   the standing rule is that the measured render wins.

   `table-fixed` is what makes them hold. Under auto layout the subject text sets its own
   column width, which is exactly how the design ends up overflowing at 1024. Subject
   declares no width, so it absorbs whatever the breakpoint-dropped columns give back.

   The measured numbers are explicitly the DESKTOP ladder — the design system qualifies
   them "measured at >=1280" — so they are gated on `xl:`. Below that the same tracks run
   narrower, which is what buys the subject a readable width in the 1024-1279 band this
   build had to redesign anyway (228px there, against 158px if the desktop widths were
   held). Nothing above 1280 moves. */
const W_CHECKBOX = "w-12";
const W_TICKET = "w-[76px] xl:w-[89px]";
const W_REQUESTER = "w-[168px]";
const W_PRIORITY = "w-[92px] xl:w-[103px]";
const W_ASSIGNEE = "w-[132px] xl:w-[159px]";
const W_STATUS = "w-[116px]";
const W_SLA = "w-[132px] xl:w-[151px]";

/* 44px rows (treatments.md: "Row height 44 desktop / 52 mobile"), measured as a 44px
   pitch between separators in the capture — the design lays the queue out as a CSS grid,
   so its 1px rule sits INSIDE the 44. `h-11` on the row plus `border-collapse` on the
   table reproduces that in table layout; without the collapse the rule is added on top
   and the pitch comes out at 45.

   `py-1` rather than the primitive's `p-2`: the stacked requester cell is the tallest
   content in the row at ~32px, and 8px of padding either side pushes it past the 44px
   floor, so every row grows to 53. */
const CELL = "px-2 py-1";

type SortKey = "number" | "updatedAt" | "priority" | "status" | "sla";

/** Rank orders for the sortable enum columns — severity descending. */
const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
const STATUS_RANK: Record<TicketStatus, number> = {
  new: 6,
  open: 5,
  pending: 4,
  on_hold: 3,
  resolved: 2,
  closed: 1,
};
const SLA_RANK = { breached: 4, at_risk: 3, on_track: 2, met: 1 } as const;

const isSolved = (t: QueueTicket) => SOLVED_STATUSES.includes(t.status);

/**
 * "My tickets" and "Breaching" depend on who is asking and on what time it is, neither of
 * which a module constant can know once the rows are real — so both arrive as context.
 */
type ViewContext = { currentUserId: string | null; now: number };

const VIEWS: {
  id: QueueView;
  label: string;
  match: (t: QueueTicket, ctx: ViewContext) => boolean;
}[] = [
  { id: "all", label: "All open", match: (t) => !isSolved(t) },
  { id: "mine", label: "My tickets", match: (t, ctx) => t.assignee?.id === ctx.currentUserId },
  { id: "unassigned", label: "Unassigned", match: (t) => t.assignee === null },
  {
    id: "breaching",
    label: "Breaching",
    match: (t, ctx) => formatSla(t.slaEvent, ctx.now, t.createdAt)?.state === "breached",
  },
  { id: "solved", label: "Solved", match: isSolved },
];

const PAGE_SIZES = [8, 15, 25, 50];

/** Two initials, or an em dash for an unassigned row. */
function initials(fullName: string) {
  return fullName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Column header with the sort caret. Hoisted to module scope rather than closed over
 * inside `TicketQueue`: a component declared during render gets a fresh identity every
 * pass, which remounts the subtree and trips `react-hooks/static-components`.
 *
 * The design shows a caret only on the sorted column — an inactive header carries none,
 * not a greyed one (treatments.md, Data display §sorting).
 */
function SortButton({
  label,
  column,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  column: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase",
        isActive ? "text-brand-accent" : "text-muted-foreground",
      )}
    >
      {label}
      {isActive ? (
        dir === "desc" ? (
          <ArrowDown className="size-3" aria-hidden />
        ) : (
          <ArrowUp className="size-3" aria-hidden />
        )
      ) : null}
    </button>
  );
}

export function TicketQueue({
  tickets,
  currentUserId,
  customers,
  now,
  state = "default",
}: {
  /** Rows from `listTickets()`. The component owns presentation, never the fetch. */
  tickets: QueueTicket[];
  /** For the "My tickets" view. Null when the caller has no session. */
  currentUserId: string | null;
  /** The requester picker for the New ticket sheet — fetched with the rows, same pass. */
  customers: CustomerOption[];
  /**
   * The instant every SLA countdown and "n min ago" is measured from, stamped ONCE on the
   * server and passed down. A `Date.now()` in here would differ between the server render
   * and hydration and mismatch every timestamp on the page.
   */
  now: number;
  state?: QueueState;
}) {
  const [view, setView] = useState<QueueView>("all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [columns, setColumns] = useState({ requester: true, assignee: true, status: true });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  /* Filtering, sorting and paging run client-side over the rows the server sent. That is a
     deliberate trade, not a leftover: the view tabs count across the WHOLE set and the
     "4 breached, 4 at risk" line is a property of the view rather than of the page, so a
     server-side page would need a second aggregate query per keystroke. `listTickets` caps
     the fetch; move the filters into the query when a tenant outgrows that. */
  const viewContext = useMemo<ViewContext>(() => ({ currentUserId, now }), [currentUserId, now]);

  const rows = useMemo(() => {
    const active = VIEWS.find((v) => v.id === view)!;
    const q = query.trim().toLowerCase();

    const filtered = tickets
      .filter((t) => active.match(t, viewContext))
      .filter((t) => priority === "all" || t.priority === priority)
      .filter((t) => status === "all" || t.status === status)
      .filter((t) =>
        q
          ? `${t.number} ${t.subject} ${t.requester.fullName} ${t.requester.company ?? ""}`
              .toLowerCase()
              .includes(q)
          : true,
      );

    const rank = (t: QueueTicket) => {
      switch (sortKey) {
        case "number":
          return t.number;
        case "priority":
          return PRIORITY_RANK[t.priority];
        case "status":
          return STATUS_RANK[t.status];
        case "sla": {
          const sla = formatSla(t.slaEvent, now, t.createdAt);
          return sla ? SLA_RANK[sla.state] : 0;
        }
        default:
          return Date.parse(t.updatedAt);
      }
    };

    return [...filtered].sort((a, b) => {
      const primary = rank(a) - rank(b);
      if (primary !== 0) return sortDir === "asc" ? primary : -primary;
      /* Ties always break newest-first, whichever way the primary column points —
         an agent scanning equal-priority rows wants the freshest at the top. */
      return byUpdatedDesc(a, b);
    });
  }, [tickets, view, viewContext, query, priority, status, sortKey, sortDir, now]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);

  const slaFor = (t: QueueTicket) => formatSla(t.slaEvent, now, t.createdAt);
  const breached = rows.filter((t) => slaFor(t)?.state === "breached").length;
  const atRisk = rows.filter((t) => slaFor(t)?.state === "at_risk").length;

  const allSelected = pageRows.length > 0 && pageRows.every((t) => selected.includes(t.id));
  const hasRows = state === "default" && rows.length > 0;

  const sort = (key: SortKey) => {
    setSortDir((d) => (sortKey === key && d === "desc" ? "asc" : "desc"));
    setSortKey(key);
    setPage(1);
  };

  const toggleAll = () =>
    setSelected(
      allSelected
        ? selected.filter((id) => !pageRows.some((t) => t.id === id))
        : Array.from(new Set([...selected, ...pageRows.map((t) => t.id)])),
    );

  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** `aria-sort` belongs on the `th`, so the caret button only reports the label. */
  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  const headClass = "h-10 px-2 text-xs font-bold tracking-wider text-muted-foreground uppercase";

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* ---- Page header ------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} in this view · {breached} breached, {atRisk} at risk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hidden, not disabled, below lg — the picker only governs the three columns
              that a narrower viewport has already dropped. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="touch" className="hidden lg:inline-flex">
                <Columns3 data-icon="inline-start" aria-hidden />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              {(["requester", "assignee", "status"] as const).map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={columns[c]}
                  onCheckedChange={(v) => setColumns((prev) => ({ ...prev, [c]: Boolean(v) }))}
                  className="capitalize"
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Opens a side sheet rather than routing to /tickets/new — raising a ticket is
              something an agent does while reading the queue, and a route change would
              discard their filters, sort, page and selection. */}
          <NewTicketSheet
            customers={customers}
            trigger={
              <Button
                size="touch"
                className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
              >
                <Plus data-icon="inline-start" aria-hidden />
                New ticket
              </Button>
            }
          />

          <Link
            href="/tickets/import"
            className="text-sm font-semibold text-brand-accent hover:underline"
          >
            Import from CSV
          </Link>
        </div>
      </div>

      {/* ---- Saved-view tabs ---------------------------------------------
          A horizontal scroller rather than a wrap: the capture at 375 cuts the strip
          after "Unassigned" instead of pushing the remaining two onto a second line. */}
      <div
        role="tablist"
        aria-label="Saved views"
        className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5"
      >
        {VIEWS.map((v) => {
          const isActive = v.id === view;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setView(v.id);
                setSelected([]);
                setPage(1);
              }}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors md:h-9",
                isActive
                  ? "border-brand-accent/40 bg-brand-accent/8 text-brand-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {v.label}
              <span className="text-xs font-medium text-muted-foreground">
                {tickets.filter((t) => v.match(t, viewContext)).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Filter bar --------------------------------------------------- */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Full width on its own row below md, then a flexible track beside the two
            selects. `flex-1` alone lets it shrink to ~40px at 375 instead of wrapping —
            the selects' `min-w-36` wins the space and the SEARCH/PRIORITY eyebrows
            collide. The design puts the field on its own row at that width. */}
        <div className="flex w-full min-w-0 flex-col gap-1.5 md:w-auto md:max-w-80 md:flex-1">
          <Label
            htmlFor="queue-search"
            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
          >
            Search
          </Label>
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="queue-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search this view"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="queue-priority"
            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
          >
            Priority
          </Label>
          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v as TicketPriority | "all");
              setPage(1);
            }}
          >
            <SelectTrigger id="queue-priority" className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="queue-status"
            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
          >
            Status
          </Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as TicketStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger id="queue-status" className="w-auto min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---- Bulk-action bar ---------------------------------------------- */}
      {selected.length > 0 && hasRows ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-brand-accent/30 bg-brand-accent/8 px-3.5 py-2.5">
          <span className="text-sm font-semibold text-brand-accent">
            {selected.length} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="neutral" size="sm">
              Assign to me
            </Button>
            <Button variant="neutral" size="sm">
              Change priority
            </Button>
            <Button variant="neutral" size="sm">
              Mark solved
            </Button>
          </div>
        </div>
      ) : null}

      {state === "loading" ? <QueueSkeleton /> : null}

      {state === "error" ? (
        <Card className="items-center gap-3 px-6 py-11 text-center ring-destructive/30">
          <span className="flex size-11 items-center justify-center rounded-full bg-destructive-soft text-destructive-strong">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <h2 className="text-base font-bold">We couldn&apos;t load your queue</h2>
          <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
            The ticket service didn&apos;t respond. Your data is safe — nothing was lost. Try again,
            and if it keeps failing check the status page.
          </p>
          <Button variant="neutral" size="touch">
            <RefreshCw data-icon="inline-start" aria-hidden />
            Retry
          </Button>
        </Card>
      ) : null}

      {/* Two ways in: the demo `?state=empty`, and a live filter that matches nothing —
          which is the one a real queue actually hits. */}
      {state === "empty" || (state === "default" && rows.length === 0) ? (
        <Card className="items-center gap-3 px-6 py-11 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-accent/8 text-brand-accent">
            <Inbox className="size-5" aria-hidden />
          </span>
          <h2 className="text-base font-bold">Queue clear</h2>
          <p className="max-w-[400px] text-sm leading-relaxed text-muted-foreground">
            Nothing matches this view right now. Change the filters, or raise a ticket on a
            customer&apos;s behalf.
          </p>
          <NewTicketSheet
            customers={customers}
            trigger={
              <Button
                size="touch"
                className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
              >
                New ticket
              </Button>
            }
          />
        </Card>
      ) : null}

      {hasRows ? (
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Pagination sits ABOVE the card list on mobile and BELOW the table from md up,
              which is what the 375 and 768 captures show. One block, reordered — never a
              second copy of the same controls. */}
          <div className="order-first flex flex-wrap items-center justify-between gap-3 md:order-last">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-muted-foreground">
                Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)}{" "}
                of {rows.length}
              </span>
              <Label htmlFor="queue-page-size" className="text-xs text-muted-foreground">
                Rows per page
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger id="queue-page-size" size="sm" className="w-[76px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="icon"
                    aria-label="Go to previous page"
                    aria-disabled={current <= 1}
                    className={current <= 1 ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.max(1, current - 1));
                    }}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </PaginationLink>
                </PaginationItem>

                {pageList(current, pageCount).map((n, i) =>
                  n === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === current}
                        className={
                          n === current
                            ? "border-brand-accent/40 bg-brand-accent/8 text-brand-accent"
                            : undefined
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="icon"
                    aria-label="Go to next page"
                    aria-disabled={current >= pageCount}
                    className={current >= pageCount ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.min(pageCount, current + 1));
                    }}
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* ---- Desktop / tablet: the table ------------------------------ */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <Table className="table-fixed border-collapse">
              <caption className="sr-only">
                Ticket queue, {rows.length} tickets, page {current} of {pageCount}
              </caption>
              <TableHeader>
                <TableRow className="border-muted bg-background hover:bg-transparent">
                  <TableHead className={cn("h-10 pl-3.5", W_CHECKBOX)}>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all tickets on this page"
                    />
                  </TableHead>
                  <TableHead
                    scope="col"
                    className={cn(headClass, W_TICKET)}
                    aria-sort={ariaSort("number")}
                  >
                    <SortButton
                      label="Ticket"
                      column="number"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={sort}
                    />
                  </TableHead>
                  <TableHead scope="col" className={headClass} aria-sort={ariaSort("updatedAt")}>
                    <SortButton
                      label="Subject"
                      column="updatedAt"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={sort}
                    />
                  </TableHead>
                  {columns.requester ? (
                    <TableHead scope="col" className={cn(headClass, W_REQUESTER, COL_REQUESTER)}>
                      Requester
                    </TableHead>
                  ) : null}
                  <TableHead
                    scope="col"
                    className={cn(headClass, W_PRIORITY)}
                    aria-sort={ariaSort("priority")}
                  >
                    <SortButton
                      label="Priority"
                      column="priority"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={sort}
                    />
                  </TableHead>
                  {columns.assignee ? (
                    <TableHead scope="col" className={cn(headClass, W_ASSIGNEE, COL_ASSIGNEE)}>
                      Assignee
                    </TableHead>
                  ) : null}
                  {columns.status ? (
                    <TableHead
                      scope="col"
                      className={cn(headClass, W_STATUS, COL_STATUS)}
                      aria-sort={ariaSort("status")}
                    >
                      <SortButton
                        label="Status"
                        column="status"
                        activeKey={sortKey}
                        dir={sortDir}
                        onSort={sort}
                      />
                    </TableHead>
                  ) : null}
                  <TableHead
                    scope="col"
                    className={cn(headClass, W_SLA)}
                    aria-sort={ariaSort("sla")}
                  >
                    <SortButton
                      label="SLA"
                      column="sla"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={sort}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageRows.map((t) => {
                  const sla = slaFor(t);
                  return (
                    <TableRow
                      key={t.id}
                      data-state={selected.includes(t.id) ? "selected" : undefined}
                      className="h-11 border-muted data-[state=selected]:bg-accent"
                    >
                      <TableCell className={cn(CELL, "pl-3.5")}>
                        <Checkbox
                          checked={selected.includes(t.id)}
                          onCheckedChange={() => toggleOne(t.id)}
                          aria-label={`Select ticket #${t.number}`}
                        />
                      </TableCell>

                      <TableCell className={cn(CELL, "font-mono text-xs text-muted-foreground")}>
                        #{t.number}
                      </TableCell>

                      {/* No width: under `table-fixed` this is the one track that absorbs
                          whatever the breakpoint-dropped columns hand back. */}
                      <TableCell className={CELL}>
                        <Link
                          href={`/tickets/${t.id}`}
                          className="block truncate text-sm font-semibold text-foreground hover:text-brand-accent"
                        >
                          {t.subject}
                        </Link>
                      </TableCell>

                      {columns.requester ? (
                        <TableCell className={cn(CELL, COL_REQUESTER)}>
                          <span className="flex flex-col leading-tight">
                            <span className="truncate text-sm leading-tight font-medium">
                              {t.requester.fullName}
                            </span>
                            {t.requester.company ? (
                              <span className="truncate text-xs leading-tight text-muted-foreground">
                                {t.requester.company}
                              </span>
                            ) : null}
                          </span>
                        </TableCell>
                      ) : null}

                      <TableCell className={CELL}>
                        <Badge tone={ticketPriorityTone[t.priority]}>
                          {PRIORITY_LABEL[t.priority]}
                        </Badge>
                      </TableCell>

                      {columns.assignee ? (
                        <TableCell className={cn(CELL, COL_ASSIGNEE)}>
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                            >
                              {t.assignee ? initials(t.assignee.fullName) : "—"}
                            </span>
                            <span className="truncate text-sm">
                              {t.assignee?.fullName ?? "Unassigned"}
                            </span>
                          </span>
                        </TableCell>
                      ) : null}

                      {columns.status ? (
                        <TableCell className={cn(CELL, COL_STATUS)}>
                          <Badge tone={ticketStatusTone[t.status]} dot>
                            {STATUS_LABEL[t.status]}
                          </Badge>
                        </TableCell>
                      ) : null}

                      <TableCell className={CELL}>
                        {sla ? (
                          <Badge tone={slaStateTone[sla.state]} dot>
                            {sla.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No SLA</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* ---- Mobile: the same rows as stacked cards -------------------- */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {pageRows.map((t) => {
              const sla = slaFor(t);
              return (
                <li key={t.id}>
                  <Card className="gap-2 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{t.number}</span>
                      <Badge tone={ticketStatusTone[t.status]} dot>
                        {STATUS_LABEL[t.status]}
                      </Badge>
                    </div>

                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-base leading-snug font-semibold text-foreground"
                    >
                      {t.subject}
                    </Link>

                    <span className="text-xs text-muted-foreground">
                      {t.requester.fullName}
                      {t.requester.company ? ` · ${t.requester.company}` : ""}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={ticketPriorityTone[t.priority]}>
                        {PRIORITY_LABEL[t.priority]}
                      </Badge>
                      {sla ? (
                        <Badge tone={slaStateTone[sla.state]} dot>
                          {sla.label}
                        </Badge>
                      ) : null}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatUpdated(t.updatedAt, now)}
                      </span>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** 1 2 3 … 12 — collapses the middle once there are more than seven pages. */
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter((n) => n >= 1 && n <= total),
  );
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(n);
  });
  return out;
}

/** Eight rows at the table's own rhythm, so the swap to real rows does not jump. */
function QueueSkeleton() {
  return (
    <Card className="overflow-hidden p-0" aria-busy="true" aria-label="Loading tickets">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex h-12 items-center gap-3 border-b border-muted px-3.5 last:border-b-0"
        >
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 max-w-80 flex-1" />
          <Skeleton className="hidden h-5 w-16 rounded-full lg:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </Card>
  );
}
