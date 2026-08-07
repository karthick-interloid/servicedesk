"use client";

import * as Lucide from "lucide-react";
import { Check, ChevronDown, FileText, Inbox, TriangleAlert, Upload } from "lucide-react";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CODE2, ICON_NAMES, MACRO_PLACEHOLDER } from "@/features/design-system/data";
import {
  Caption,
  DocCode,
  DocSection,
  Eyebrow,
  GroupHead,
  M,
  PANEL,
  PANEL_FLUSH,
  SubHead,
} from "@/features/design-system/components/doc-shell";
import { cn } from "@/lib/utils";

/* Sections 15–21: Data display · Feedback & states · Icons · Overlays ·
   Advanced inputs · Table anatomy · Charts. */

/* --------------------------------------------------------- 15. DATA DISPLAY */

/** Row 83 — the queue row is CSS grid, not table layout, so tracks can drop by
 *  breakpoint. Semantics stay real `th`/`td`. Design's six desktop tracks. */
const QUEUE_TRACKS =
  "grid grid-cols-[40px_72px_minmax(0,1fr)_92px_148px_128px] items-center gap-2.5 px-3.5";

const QUEUE_ROWS = [
  {
    id: "#4819",
    subject: "Can't log in after SSO switch — 400 error",
    priority: "Urgent",
    priorityTone: "error",
    who: "SO",
    name: "Sam Okafor",
    sla: "Breached 26m",
    slaTone: "error",
    selected: true,
  },
  {
    id: "#4821",
    subject: "Duplicate charge on invoice INV-2291",
    priority: "High",
    priorityTone: "warning",
    who: "PR",
    name: "Priya Raman",
    sla: "1h 12m left",
    slaTone: "warning",
    selected: false,
  },
  {
    id: "#4803",
    subject: "Export CSV missing custom fields",
    priority: "Low",
    priorityTone: "neutral",
    who: "—",
    name: "Unassigned",
    sla: "4h 20m left",
    slaTone: "success",
    selected: false,
  },
] as const;

function SectionData() {
  return (
    <DocSection
      id="data"
      eyebrow="Components"
      title="Data display"
      description="The queue row is the app's densest pattern: a CSS grid, not a table layout, so columns can be dropped by breakpoint. 44px rows on desktop, 52px on mobile, hairline separators, brand-soft tint when selected."
    >
      <div className="overflow-x-auto">
        <Card className={cn(PANEL_FLUSH, "min-w-245")}>
          <Table className="block">
            <TableHeader className="block [&_tr]:border-b-0">
              <TableRow
                className={cn(
                  QUEUE_TRACKS,
                  "h-10 border-0 bg-background text-xs font-bold tracking-wider text-slate-400 uppercase hover:bg-background",
                )}
              >
                {["", "ID", "Subject", "Priority", "Assignee", "SLA"].map((h, i) => (
                  <TableHead
                    key={i}
                    scope="col"
                    className="flex h-auto items-center p-0 text-xs font-bold tracking-wider text-slate-400 uppercase"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="block">
              {QUEUE_ROWS.map((r) => (
                <TableRow
                  key={r.id}
                  data-state={r.selected ? "selected" : undefined}
                  className={cn(
                    QUEUE_TRACKS,
                    "min-h-11 border-0 border-t border-muted",
                    r.selected ? "bg-accent hover:bg-accent" : "bg-card hover:bg-card",
                  )}
                >
                  <TableCell className="flex p-0">
                    <Checkbox className="size-5 rounded-sm" defaultChecked={r.selected} />
                  </TableCell>
                  <TableCell className="block p-0 font-mono text-xs text-muted-foreground">
                    {r.id}
                  </TableCell>
                  <TableCell className="block truncate p-0 text-sm font-semibold">
                    {r.subject}
                  </TableCell>
                  <TableCell className="flex p-0">
                    <Badge tone={r.priorityTone}>{r.priority}</Badge>
                  </TableCell>
                  <TableCell className="flex min-w-0 items-center gap-1.5 p-0">
                    <Avatar className="size-6 flex-none">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-bold",
                          r.who === "—"
                            ? "bg-border text-muted-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {r.who}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "truncate text-xs",
                        r.who === "—" ? "text-slate-400" : "text-secondary-foreground",
                      )}
                    >
                      {r.name}
                    </span>
                  </TableCell>
                  <TableCell className="flex p-0">
                    <Badge tone={r.slaTone} dot>
                      {r.sla}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center gap-3 border-t border-muted bg-background px-3.5 py-3">
            <span className="text-xs font-semibold text-primary">1 selected</span>
            <span className="flex gap-2">
              <Button variant="neutral" size="touch-sm">
                Assign
              </Button>
              <Button variant="neutral" size="touch-sm">
                Set priority
              </Button>
              <Button variant="quiet" size="touch-sm">
                Clear
              </Button>
            </span>
          </div>
        </Card>
      </div>
      <Caption>
        The desktop track list is <M>40px 74px minmax(0,1fr) 92px 150px 128px</M> — scroll sideways
        to read it at full width — all six tracks fit from <M>xl:</M>. Below that the assignee and
        SLA tracks drop to <M>36px 64px minmax(0,1fr) 84px</M>, and below <M>md:</M> the row becomes
        a card.
      </Caption>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {/* Row 86 — Avatar, AvatarFallback only. The design ships no photos. */}
        <Card className={cn(PANEL, "gap-3.5 px-5")}>
          <Eyebrow>Avatars — initials, no photos</Eyebrow>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="size-6">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                SO
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                MO
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-9">
              <AvatarFallback className="bg-muted-foreground text-xs font-bold text-primary-foreground">
                DW
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-8">
              <AvatarFallback className="bg-warning text-xs font-bold text-primary-foreground">
                JK
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-8">
              <AvatarFallback className="bg-border text-sm font-bold text-muted-foreground">
                —
              </AvatarFallback>
            </Avatar>
          </div>
          <Caption>
            Brand fill for agents, slate for customers, amber for note authors, 200-grey for
            unassigned. 24 / 32 / 34 / 36px.
          </Caption>
        </Card>

        {/* Row 87 — message bubbles: Card + Avatar + three surfaces. */}
        <Card className={cn(PANEL, "gap-3 px-5")}>
          <Eyebrow>Message bubbles</Eyebrow>
          {[
            {
              who: "MF",
              av: "bg-muted-foreground text-primary-foreground",
              shell: "border-border bg-card",
              text: "Customer — white surface, 200 border.",
            },
            {
              who: "PR",
              av: "bg-primary text-primary-foreground",
              shell: "border-success/25 bg-success-soft",
              text: "Agent reply — brand-tinted surface.",
            },
            {
              who: "PR",
              av: "bg-warning text-primary-foreground",
              shell: "border-note-border bg-note",
              text: "Internal note — amber, never sent to the customer.",
            },
          ].map((b) => (
            <div key={b.text} className="flex items-start gap-2.5">
              <Avatar className="size-8 flex-none">
                <AvatarFallback className={cn("text-xs font-bold", b.av)}>{b.who}</AvatarFallback>
              </Avatar>
              <div className={cn("rounded-lg border px-3.5 py-3 text-sm leading-[1.6]", b.shell)}>
                {b.text}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </DocSection>
  );
}

/* ---------------------------------------------------- 16. FEEDBACK & STATES */

function SectionFeedback() {
  return (
    <DocSection
      id="feedback"
      eyebrow="Components"
      title="Feedback & states"
      description="Every list screen ships four states — default, loading, empty, error. Empty states name the reason and offer the action that resolves it; error states promise nothing was lost."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(288px,1fr))] gap-4">
        {/* Row 65 — StateCard: Card + icon tile + Button, one API for empty and error. */}
        <StateCard
          tone="brand"
          icon={<Inbox className="size-5.5" />}
          title="Queue clear"
          body="Nothing matches this view. Change the filters, or raise a ticket for a customer."
          action={
            <Button variant="primary" size="touch">
              New ticket
            </Button>
          }
        />
        <StateCard
          tone="error"
          icon={<TriangleAlert className="size-5.5" />}
          title="We couldn't load your queue"
          body="The ticket service didn't respond. Your data is safe — nothing was lost."
          action={
            <Button variant="neutral" size="touch">
              Retry
            </Button>
          }
        />

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <Eyebrow>Toast · tooltip · stepper</Eyebrow>
          <div className="flex flex-col items-start gap-3">
            {/* Row 70 — Toast is themed to the inverse surface. Shown as its rendered shape. */}
            <span className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-xl">
              Priority set to High on 3 tickets
            </span>
            {/* Row 71 — Tooltip surface: #0F172A, 7px radius, 12px label. */}
            <span className="inline-flex items-center rounded-sm bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background">
              Collapse sidebar
            </span>
            {/* Row 72 — Stepper: numbered badges joined by separators. */}
            <div className="flex flex-wrap items-center gap-2.5">
              <StepDot done>✓</StepDot>
              <span className="text-xs font-semibold text-muted-foreground">Business hours</span>
              <Separator className="w-5" />
              <StepDot done>2</StepDot>
              <span className="text-xs font-bold">First SLA policy</span>
              <Separator className="w-5" />
              <StepDot>3</StepDot>
              <span className="text-xs font-medium text-muted-foreground">Invite your team</span>
            </div>
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <Eyebrow>CSAT · shortcuts</Eyebrow>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex size-10 items-center justify-center rounded-lg border border-warning bg-warning-soft text-warning-strong"
              >
                <StarGlyph filled />
              </span>
            ))}
            <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-slate-400">
              <StarGlyph />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              ["/", "Focus search"],
              ["G then T", "Go to ticket queue"],
              ["Esc", "Close overlay"],
            ].map(([k, v]) => (
              <span key={k} className="flex items-center gap-2.5">
                {/* Row 73 — utility-styled native <kbd>; no primitive exists or is needed. */}
                <kbd className="rounded-sm border border-b-2 border-border bg-background px-1.5 py-1 font-mono text-xs font-bold text-secondary-foreground">
                  {k}
                </kbd>
                <span className="text-xs text-muted-foreground">{v}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
      <DocCode code={CODE2.toast} />
    </DocSection>
  );
}

/** Row 65 — StateCard, the design's own one-API empty/error card. */
function StateCard({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: "brand" | "error";
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <Card className={cn(PANEL, "items-center gap-2.5 px-5 py-8 text-center")}>
      {/* Row 63 — icon tile: tone-soft bg, tone-strong glyph, utility classes only. */}
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-xl",
          tone === "brand"
            ? "bg-accent text-accent-foreground"
            : "bg-destructive-soft text-destructive-strong",
        )}
      >
        {icon}
      </span>
      <span className="text-base font-bold">{title}</span>
      <span className="max-w-[34ch] text-sm leading-[1.6] text-pretty text-muted-foreground">
        {body}
      </span>
      {action}
    </Card>
  );
}

function StepDot({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-xs font-bold",
        done ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function StarGlyph({ filled }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.75"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.5 2.6l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4 8.1l5.2-.8z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ 17. ICONS */

function SectionIcons() {
  return (
    <DocSection
      id="icons"
      eyebrow="Components"
      title="Icons"
      description={
        <>
          Lucide, stroke only, <M>currentColor</M>, 1.75 in navigation and 2 elsewhere. Sizes 16 /
          18 / 20 / 22. No filled icons, no emoji, and never an icon without a label unless it
          carries a tooltip.
        </>
      }
    >
      <Card className={cn(PANEL, "gap-4 px-5")}>
        {/* D10 — icon catalogue: hairline border, rounded-lg, 20px glyph. Not row 63. */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3.5">
          {ICON_NAMES.map((name) => {
            const Glyph = Lucide[name] as React.ComponentType<{ className?: string }>;
            return (
              <div
                key={name}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-muted px-2 py-3"
              >
                <Glyph className="size-5 text-secondary-foreground" />
                <span className="text-center font-mono text-xs text-muted-foreground">{name}</span>
              </div>
            );
          })}
        </div>
        <Caption>
          Icon tiles: 30–38px square, 8–10px radius, tone-soft background with tone-strong glyph —
          used in notifications, search results, and empty states.
        </Caption>
      </Card>
    </DocSection>
  );
}

/* --------------------------------------------------------------- 18. OVERLAYS */

/** The design draws each overlay flattened onto a slate-200 stage rather than opening it. */
const STAGE = "rounded-xl border border-border bg-border p-5";

function SectionOverlays() {
  return (
    <DocSection
      id="overlays"
      eyebrow="Components"
      title="Overlays"
      description={
        <>
          Four overlay types, one rule each: dialogs interrupt, sheets navigate, menus choose, trays
          inform. All sit on a <M>rgba(15,23,42,.45)</M> scrim, close on Esc and on scrim click —
          except destructive confirms, which require an explicit choice.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <div className="flex flex-col gap-2">
          <SubHead>Destructive confirm — dialog</SubHead>
          <div className={cn(STAGE, "flex items-center justify-center")}>
            <Card className={cn(PANEL, "w-full max-w-90 gap-3 px-5 shadow-xl")}>
              <span className="flex size-9 items-center justify-center rounded-md bg-destructive-soft text-destructive-strong">
                <TrashGlyph />
              </span>
              <span className="text-base font-bold">Delete this SLA policy?</span>
              <span className="text-sm leading-[1.6] text-pretty text-muted-foreground">
                14 open tickets currently use{" "}
                <span className="font-semibold text-secondary-foreground">
                  Urgent — 1h first response
                </span>
                . They&rsquo;ll fall back to the default policy and their targets will be
                recalculated.
              </span>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="quiet" size="touch">
                  Keep it
                </Button>
                <Button variant="danger" size="touch">
                  Delete policy
                </Button>
              </div>
            </Card>
          </div>
          <Caption>
            Title asks a question. Body states the consequence in numbers. The destructive verb is
            repeated on the button — never “OK”.
          </Caption>
        </div>

        <div className="flex flex-col gap-2">
          <SubHead>Column picker — dropdown menu</SubHead>
          <div className={cn(STAGE, "flex items-start justify-center")}>
            <Card
              className={cn(
                PANEL,
                "w-full max-w-57 gap-px rounded-lg p-1.5 shadow-lg [--card-spacing:--spacing(0)]",
              )}
            >
              <span className="px-2.5 pt-1.5 pb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Columns
              </span>
              {[
                { label: "Requester", on: true, hi: true },
                { label: "Assignee", on: true, hi: false },
                { label: "Channel", on: false, hi: false },
                { label: "Updated", on: false, hi: false },
              ].map((it) => (
                <span
                  key={it.label}
                  className={cn(
                    "flex min-h-8 items-center gap-2 rounded-sm px-2.5 text-sm",
                    it.hi
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-secondary-foreground",
                  )}
                >
                  {it.on ? (
                    <span className="flex size-4 items-center justify-center rounded-xs bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : (
                    <span className="size-4 rounded-xs border border-input" />
                  )}
                  {it.label}
                </span>
              ))}
              <Separator className="my-1.5 bg-muted" />
              <span className="flex min-h-8 items-center rounded-sm px-2.5 text-sm text-muted-foreground">
                Reset to default
              </span>
            </Card>
          </div>
          <Caption>
            6px padding shell, 34px rows, 7px item radius, hairline separators. Checked rows tint
            brand-soft; the trigger shows a count. These four are <em>optional</em> columns layered
            on the queue&rsquo;s six fixed tracks — the user controls them, not the breakpoint; from{" "}
            <M>2xl:</M> they fit without sideways scrolling.
          </Caption>
        </div>

        <div className="flex flex-col gap-2">
          <SubHead>Notification tray — popover</SubHead>
          <div className={cn(STAGE, "flex items-start justify-center")}>
            <Card className={cn(PANEL_FLUSH, "w-full max-w-80 shadow-lg")}>
              <div className="flex items-center gap-2.5 border-b border-muted px-3.5 py-3">
                <span className="text-sm font-bold">Notifications</span>
                <span className="ml-auto text-xs font-semibold text-primary">Mark all read</span>
              </div>
              {/* Unread: brand-tinted surface AND a trailing dot — never bold-only. */}
              <div className="flex gap-2.5 bg-success-soft px-3.5 py-3">
                <span className="flex size-7 flex-none items-center justify-center rounded-md bg-destructive-soft text-destructive-strong">
                  <TriangleAlert className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">
                    #4819 breached its first-response target
                  </span>
                  <span className="text-xs text-muted-foreground">26 minutes ago</span>
                </span>
                <span className="mt-1 size-1.5 flex-none rounded-full bg-primary" />
              </div>
              <div className="flex gap-2.5 border-t border-muted px-3.5 py-3">
                <span className="flex size-7 flex-none items-center justify-center rounded-md bg-success-soft text-primary">
                  <Check className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm text-secondary-foreground">Sam solved #4790</span>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </span>
              </div>
            </Card>
          </div>
          <Caption>
            Unread rows carry a brand-tinted surface and a trailing dot — never bold-only, which
            reads as emphasis rather than state.
          </Caption>
        </div>

        <div className="flex flex-col gap-2">
          <SubHead>Mobile nav — sheet, 272px</SubHead>
          <div className="flex h-66 overflow-hidden rounded-xl border border-border">
            <div className="flex w-47 flex-none flex-col gap-1 bg-card px-2.5 py-3.5 shadow-xl">
              <span className="flex items-center gap-2 px-2 pb-2.5">
                <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">
                  N
                </span>
                <span className="text-xs font-bold">Northwind</span>
              </span>
              <span className="flex min-h-11 items-center rounded-md bg-accent px-2.5 text-sm font-semibold text-accent-foreground">
                Tickets
              </span>
              <span className="flex min-h-11 items-center rounded-md px-2.5 text-sm text-secondary-foreground">
                Customers
              </span>
              <span className="flex min-h-11 items-center rounded-md px-2.5 text-sm text-secondary-foreground">
                Knowledge base
              </span>
            </div>
            {/* The design's scrim: rgba(15,23,42,.45) — `--foreground` at 45%. */}
            <div className="flex-1 bg-foreground/45" />
          </div>
          <Caption>
            Slides in over 220ms, 44px rows, scrim dismisses. Focus is trapped and returns to the
            trigger on close.
          </Caption>
        </div>
      </div>
    </DocSection>
  );
}

function TrashGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

/* -------------------------------------------------------- 19. ADVANCED INPUTS */

function SectionAdvancedInputs() {
  return (
    <DocSection
      id="inputs2"
      eyebrow="Components"
      title="Advanced inputs"
      description={
        <>
          The controls the settings and import screens need beyond a text field. All inherit the
          Input shell — 6px radius, <M>--input</M> border, 3px focus ring — so a form mixing them
          stays on one baseline.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-4 px-5")}>
          <div className="flex flex-col gap-1.5">
            <span className="flex items-baseline gap-1">
              <span className="text-sm font-semibold">Reply template</span>
              {/* Required marker is --destructive-strong, not --destructive. */}
              <span className="text-sm text-destructive-strong">*</span>
            </span>
            <Textarea
              readOnly
              value={MACRO_PLACEHOLDER}
              className="min-h-18 resize-none rounded-sm border-input px-3 py-2.5 text-sm leading-[1.6] text-secondary-foreground"
            />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">
                Placeholders resolve when the macro runs
              </span>
              <span className="font-mono text-xs text-slate-400">104 / 500</span>
            </div>
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Business hours</span>
            <div className="flex items-center gap-2">
              {/* Row 54 — stock Input type="time"; `font-mono` is a utility, not a variant. */}
              <Input
                type="time"
                defaultValue="09:00"
                className="h-10 flex-1 rounded-sm font-mono text-sm"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                defaultValue="18:30"
                className="h-10 flex-1 rounded-sm font-mono text-sm"
              />
            </div>
            <Caption>
              Time inputs are mono and 24-hour; the zone is named once per card, not per field
            </Caption>
          </div>
        </Card>

        {/* Row 56 — dropzone: Card + Button + input type="file". No shadcn dropzone. */}
        <Card className={cn(PANEL, "gap-3.5 px-5")}>
          <Eyebrow>Dropzone — CSV import</Eyebrow>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-input bg-background px-4 py-6 text-center">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Upload className="size-4.5" />
            </span>
            <span className="text-sm font-semibold">Drop your CSV here</span>
            <span className="text-xs text-muted-foreground">
              Up to 10 MB · we&rsquo;ll map columns on the next step
            </span>
            <input type="file" accept=".csv" className="sr-only" />
            <span className="pointer-events-none mt-1 inline-flex">
              <Button variant="neutral" size="touch-sm" asChild>
                <span>Choose file</span>
              </Button>
            </span>
          </label>
          <div className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5">
            <span className="flex size-7 flex-none items-center justify-center rounded-sm bg-muted text-secondary-foreground">
              <FileText className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-semibold">zendesk-export.csv</span>
              <span className="font-mono text-xs text-muted-foreground">412 rows · 1.2 MB</span>
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Remove</span>
          </div>
          <Caption>
            Dashed 1.5px border at rest; on drag-over the border and icon tile go brand and the
            surface tints brand-soft.
          </Caption>
        </Card>
      </div>
    </DocSection>
  );
}

/* --------------------------------------------------------- 20. TABLE ANATOMY */

const ANATOMY_TRACKS = "grid grid-cols-[40px_96px_minmax(0,1fr)_132px] items-center gap-2.5 px-3.5";

function SectionTables() {
  return (
    <DocSection
      id="tables"
      eyebrow="Components"
      title="Table anatomy"
      description="Hairline separators, never zebra striping — the queue is scanned vertically by one column at a time, and stripes fight that. Header is a sunken band, sticky under the filter bar. Sort is a single active column with a directional caret."
    >
      <Card className={cn(PANEL_FLUSH)}>
        <Table className="block">
          <TableHeader className="block [&_tr]:border-b-0">
            <TableRow
              className={cn(
                ANATOMY_TRACKS,
                "h-10 border-0 border-b border-border bg-background hover:bg-background",
              )}
            >
              <TableHead className="flex h-auto items-center p-0">
                {/* Row 50 — indeterminate is restricted to the table header. */}
                <Checkbox
                  checked="indeterminate"
                  className="size-5 rounded-sm border-primary bg-primary"
                />
              </TableHead>
              {/* Row 84 — one sorted column at a time; inactive headers show NO caret. */}
              <TableHead
                scope="col"
                aria-sort="descending"
                className="flex h-auto items-center gap-1 p-0 text-xs font-bold tracking-wider text-primary uppercase"
              >
                ID
                <ChevronDown className="size-3 stroke-[2.4]" />
              </TableHead>
              <TableHead
                scope="col"
                className="flex h-auto items-center p-0 text-xs font-bold tracking-wider text-slate-400 uppercase"
              >
                Subject
              </TableHead>
              <TableHead
                scope="col"
                className="flex h-auto items-center p-0 text-xs font-bold tracking-wider text-slate-400 uppercase"
              >
                Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block">
            {[
              {
                id: "#4821",
                subject: "Duplicate charge on invoice INV-2291",
                at: "12 minutes ago",
                hover: false,
              },
              {
                id: "#4819",
                subject: "Can't log in after SSO switch",
                at: "26 minutes ago",
                hover: true,
              },
            ].map((r) => (
              <TableRow
                key={r.id}
                className={cn(
                  ANATOMY_TRACKS,
                  "min-h-11 border-0 border-b border-muted",
                  // The hover tint is green-50 — the same 2% brand step as --success-soft.
                  r.hover ? "bg-success-soft hover:bg-success-soft" : "bg-card hover:bg-card",
                )}
              >
                <TableCell className="flex p-0">
                  <Checkbox className="size-5 rounded-sm" />
                </TableCell>
                <TableCell className="block p-0 font-mono text-xs text-muted-foreground">
                  {r.id}
                </TableCell>
                <TableCell className="block truncate p-0 text-sm font-semibold">
                  {r.subject}
                </TableCell>
                <TableCell className="block p-0 text-xs text-muted-foreground">{r.at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-2.5 border-b border-muted bg-background px-3.5 py-2.5">
          <Caption>
            ↑ row above is <M>green-50</M> — hover tint, 2% brand. Selected rows use the full
            brand-soft <M>green-100</M>.
          </Caption>
        </div>
        {/* Row 85 — expanded row: indents to the first content column, adds no border. */}
        <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2.5 bg-card p-3.5">
          <span />
          <span className="text-xs leading-[1.65] text-pretty text-secondary-foreground">
            <span className="font-bold text-foreground">Expanded row.</span> Used for audit-log
            entries and import errors, where the detail is too long for a cell but too small for its
            own screen. Indents to the first content column, keeps the row&rsquo;s hairline, adds no
            border of its own.
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {[
          {
            t: "Header checkbox",
            b: "Three states: empty, indeterminate (a 9×2 bar, shown above), and checked. Indeterminate means “some on this page”; it never means “some across all pages”.",
          },
          {
            t: "Sorting",
            b: "One sorted column at a time. The active header goes brand-ink with a caret; inactive headers show no caret at all — not a greyed one.",
          },
          {
            t: "Truncation",
            b: "Subject truncates with an ellipsis on one line and carries a tooltip. Names truncate; IDs, badges and timestamps never do — they get fixed tracks instead.",
          },
        ].map((c) => (
          <Card key={c.t} className={cn(PANEL, "gap-2 px-4 [--card-spacing:--spacing(4)]")}>
            <span className="text-xs font-bold">{c.t}</span>
            <span className="text-xs leading-[1.6] text-muted-foreground">{c.b}</span>
          </Card>
        ))}
      </div>
    </DocSection>
  );
}

/* ----------------------------------------------------------------- 21. CHARTS */

/* Row 89 — `ui/chart.tsx` (recharts). Series come from --chart-1; the two weekend bars
   use --chart-muted, because "outside business hours is context, not a data series".
   The chart carries no border of its own — the Card provides it. */
const VOLUME = [
  { day: "M", n: 17.6, weekend: false },
  { day: "T", n: 24.8, weekend: false },
  { day: "W", n: 15.2, weekend: false },
  { day: "T", n: 31.2, weekend: false },
  { day: "F", n: 28.0, weekend: false },
  { day: "S", n: 10.4, weekend: true },
  { day: "S", n: 7.2, weekend: true },
];

const VOLUME_CONFIG = {
  n: { label: "Tickets", color: "var(--chart-1)" },
} satisfies ChartConfig;

function SectionCharts() {
  return (
    <DocSection
      id="charts"
      eyebrow="Components"
      title="Charts"
      description={
        <>
          Five series, no two from the same hue family — never a rainbow. Gridlines are horizontal
          only at <M>slate-100</M>, axis labels are <M>font-mono text-xs</M>, and no chart carries a
          border of its own: the card provides it.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-4 px-5")}>
          <GroupHead title="Ticket volume" note="Last 7 days" />
          <ChartContainer config={VOLUME_CONFIG} className="h-40 w-full">
            <BarChart data={VOLUME} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barGap={8}>
              {/* Horizontal gridlines only, at slate-100. */}
              <CartesianGrid vertical={false} stroke="var(--muted)" strokeWidth={1} />
              <YAxis
                width={28}
                ticks={[0, 20, 40]}
                domain={[0, 40]}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "var(--color-slate-400)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tickMargin={6}
                tick={{
                  fill: "var(--color-slate-400)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {VOLUME.map((d, i) => (
                  <Cell key={i} fill={d.weekend ? "var(--chart-muted)" : "var(--chart-1)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <Caption>
            Weekends drop to <M>--chart-muted</M> (slate-300) — outside business hours is context,
            not a data series.
          </Caption>
        </Card>

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <GroupHead title="Series palette" />
          <div className="flex flex-col gap-2.5">
            {[
              { c: "bg-chart-1", n: "chart-1", d: "Primary series — volume, this period" },
              { c: "bg-chart-2", n: "chart-2", d: "Comparison — previous period" },
              { c: "bg-chart-3", n: "chart-3", d: "Neutral / total / benchmark line" },
              { c: "bg-chart-4", n: "chart-4", d: "Secondary category" },
              { c: "bg-chart-5", n: "chart-5", d: "At risk" },
            ].map((s) => (
              <span key={s.n} className="flex items-center gap-2.5">
                <span className={cn("h-2.5 w-6 rounded-[4px]", s.c)} />
                <span className="w-15 font-mono text-xs text-secondary-foreground">{s.n}</span>
                <span className="text-xs text-muted-foreground">{s.d}</span>
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-muted pt-3.5">
            <span className="text-xs font-bold">Chart tooltip</span>
            <span className="inline-flex w-fit flex-col gap-1 self-start rounded-md bg-foreground px-2.5 py-2">
              <span className="text-xs text-slate-400">Thu 30 Jul</span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-xs bg-chart-2" />
                <span className="text-xs font-semibold text-background">31 tickets</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-xs bg-chart-3" />
                <span className="text-xs text-slate-300">28 last week</span>
              </span>
            </span>
            <Caption>
              Inverse surface, series swatch per row, value bold and label muted. Follows the
              cursor; never covers the point it describes.
            </Caption>
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-3.5 px-5")}>
          <GroupHead title="No-data chart" />
          {/* Row 91 — no-data: axes and gridlines stay, only the series is absent. */}
          <div className="relative">
            <ChartContainer config={VOLUME_CONFIG} className="h-40 w-full">
              <BarChart data={VOLUME} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--muted)" strokeWidth={1} />
                <YAxis
                  width={28}
                  ticks={[0, 20, 40]}
                  domain={[0, 40]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "var(--color-slate-400)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tickMargin={6}
                  tick={{
                    fill: "var(--color-slate-400)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </BarChart>
            </ChartContainer>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-2.5 text-xs text-muted-foreground">
                No tickets in this range
              </span>
            </span>
          </div>
          <Caption>
            Axes and gridlines stay; only the series is absent. A collapsed chart shifts the whole
            card and reads as an error.
          </Caption>
        </Card>
      </div>
    </DocSection>
  );
}

export function Part03() {
  return (
    <>
      <SectionData />
      <SectionFeedback />
      <SectionIcons />
      <SectionOverlays />
      <SectionAdvancedInputs />
      <SectionTables />
      <SectionCharts />
    </>
  );
}
