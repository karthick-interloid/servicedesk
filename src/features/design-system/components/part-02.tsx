"use client";

import { Check, ChevronDown, Loader2, Search, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CODE2 } from "@/features/design-system/data";
import {
  Caption,
  DocCode,
  DocSection,
  Eyebrow,
  M,
  PANEL,
  PANEL_FLUSH,
  SubHead,
} from "@/features/design-system/components/doc-shell";
import { cn } from "@/lib/utils";

/* Sections 9–14: Form controls · Cards · Alerts & banners · Skeletons ·
   Loaders & progress · Navigation. */

/** Design's field shell: `h-11 md:h-10 rounded-sm` on the stock Input (treatments §5.2). */
const FIELD = "h-11 rounded-sm md:h-10";

/* ----------------------------------------------------------- 9. FORM CONTROLS */

function SectionForms() {
  return (
    <DocSection
      id="forms"
      eyebrow="Components"
      title="Form controls"
      description={
        <>
          Every field is label-above, 6px radius, 44px tall on mobile and 40px on desktop. Hints sit
          under the field in muted text and are replaced — not joined — by the error message. Errors
          say what to do next, not just what failed. One known deviation: the bundle&rsquo;s error
          Input hardcodes its focus glow at the stock Interloid red, so the Password specimen below
          shows a red that exists nowhere else in the system — the React port uses{" "}
          <M>aria-invalid:ring-destructive/25</M> instead.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-4 px-5")}>
          <Eyebrow>Input states</Eyebrow>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-email" className="text-sm font-semibold">
              Work email
            </Label>
            <Input id="ds-email" type="email" placeholder="you@northwind.io" className={FIELD} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-slug" className="text-sm font-semibold">
              Portal address
            </Label>
            <Input id="ds-slug" defaultValue="northwind" className={FIELD} />
            <span className="text-xs text-muted-foreground">
              Your customers will reach you at northwind.servicedesk.pro
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-pw" className="text-sm font-semibold">
              Password
            </Label>
            <Input
              id="ds-pw"
              type="password"
              defaultValue="hunter2hunter2"
              aria-invalid
              className={FIELD}
            />
            {/* Error replaces the hint — it never stacks with it. */}
            <span className="text-xs leading-[1.5] text-destructive-strong">
              That email and password don&rsquo;t match. Check both, or reset your password.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-seats" className="text-sm font-semibold">
              Seats billed
            </Label>
            <Input id="ds-seats" defaultValue="6" disabled className={FIELD} />
            <span className="text-xs text-muted-foreground">Managed by your plan</span>
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <Eyebrow>Select, toggles, search</Eyebrow>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-role" className="text-sm font-semibold">
              Invite as
            </Label>
            <Select defaultValue="Agent">
              <SelectTrigger id="ds-role" className={cn(FIELD, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Billing Admin">Billing Admin</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Managers can edit SLA policies</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Checkbox id="ds-stay" defaultChecked />
              <Label htmlFor="ds-stay" className="text-sm font-normal">
                Keep me signed in
              </Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox id="ds-sla" />
              <Label htmlFor="ds-sla" className="text-sm font-normal">
                Email me when an SLA is about to breach
              </Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SubHead>Search field — 36px, icon-leading</SubHead>
            {/* Row 52 — COMPOSE: input-group + input + lucide Search. */}
            <InputGroup className="h-9 rounded-md">
              <InputGroupAddon>
                <Search className="size-4 text-slate-400" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search tickets, people, invoices" />
              <InputGroupAddon align="inline-end">
                <InputGroupText className="rounded-sm border border-border px-1 font-mono text-xs text-slate-400">
                  /
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <SubHead>Row checkbox — 20px, brand fill when selected</SubHead>
            <div className="flex items-center gap-2.5">
              <Checkbox className="size-5 rounded-sm" />
              <Checkbox className="size-5 rounded-sm" defaultChecked />
              <Checkbox className="size-5 rounded-sm bg-muted" disabled />
              <span className="text-xs text-muted-foreground">rest · checked · disabled</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className={cn(PANEL, "gap-3.5 px-5")}>
        <Eyebrow>Reply composer — public vs internal note</Eyebrow>
        {/* Row 88 — COMPOSE: tabs + textarea + button. */}
        <Tabs defaultValue="public">
          <TabsList className="h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="public"
              className="min-h-9 rounded-md border border-transparent px-3.5 text-sm font-semibold text-muted-foreground data-[state=active]:border-accent-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none"
            >
              Public reply
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="min-h-9 rounded-md border border-transparent px-3.5 text-sm font-semibold text-muted-foreground data-[state=active]:border-accent-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none"
            >
              Internal note
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Textarea
            placeholder="Write a reply the customer will see…"
            className="min-h-20 resize-none rounded-none border-0 px-4 py-3.5 text-sm leading-[1.6] shadow-none focus-visible:ring-0"
          />
          <div className="flex flex-wrap items-center gap-2.5 border-t border-muted bg-background px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground">Macros · Attach</span>
            <span className="ml-auto flex gap-2">
              <Button variant="quiet" size="touch-sm">
                Solve
              </Button>
              <Button variant="primary" size="touch-sm">
                Send reply
              </Button>
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-note-border bg-note">
          <Textarea
            placeholder="Only your team sees this note…"
            className="min-h-14 resize-none rounded-none border-0 bg-transparent px-4 py-3.5 text-sm leading-[1.6] text-note-foreground shadow-none placeholder:text-note-foreground/70 focus-visible:ring-0"
          />
          <div className="flex flex-wrap items-center gap-2.5 border-t border-note-border px-3.5 py-2.5">
            <span className="text-xs text-note-foreground">Not visible to the customer</span>
            <span className="ml-auto">
              <Button variant="neutral" size="touch-sm">
                Add note
              </Button>
            </span>
          </div>
        </div>
      </Card>
      <DocCode code={CODE2.forms} />
    </DocSection>
  );
}

/* ------------------------------------------------------------------- 10. CARDS */

const STAT_TILES = [
  {
    label: "Open tickets",
    figure: "38",
    delta: "↓ 6 from last week",
    tone: "text-muted-foreground",
  },
  { label: "First response", figure: "27m", delta: "Inside every target", tone: "text-primary" },
  { label: "SLA met", figure: "94%", delta: "6% breached this month", tone: "text-warning-strong" },
  { label: "CSAT", figure: "4.6", delta: "212 ratings", tone: "text-muted-foreground" },
] as const;

function SectionCards() {
  return (
    <DocSection
      id="cards"
      eyebrow="Components"
      title="Cards"
      description="Four shapes cover every screen: a plain settings panel, a stat tile, a list panel with a hairline-divided body, and a selectable plan card. All white, all hairline-bordered, elevation only on hover or selection."
    >
      {/* Row 60 — stat tile: Card + eyebrow + mono figure + delta line. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(236px,1fr))] gap-3.5">
        {STAT_TILES.map((s) => (
          <Card key={s.label} className={cn(PANEL, "gap-2 px-4 [--card-spacing:--spacing(4)]")}>
            <Eyebrow>{s.label}</Eyebrow>
            <span className="font-mono text-2xl font-bold tracking-tight">{s.figure}</span>
            <span className={cn("text-xs", s.tone)}>{s.delta}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {/* Row 61 — list panel: Card + hairline-divided rows. */}
        <Card className={cn(PANEL_FLUSH)}>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-base font-bold">Business hours</span>
            <span className="ml-auto">
              <Button variant="neutral" size="touch-sm">
                Edit
              </Button>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-muted px-4 py-3">
            <span className="text-sm text-secondary-foreground">Mon – Fri</span>
            <span className="font-mono text-xs text-muted-foreground">09:00 – 18:30 IST</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-muted px-4 py-3">
            <span className="text-sm text-secondary-foreground">Saturday</span>
            <Badge tone="neutral">Closed</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-muted px-4 py-3">
            <span className="text-sm text-secondary-foreground">Holidays</span>
            <span className="text-xs text-muted-foreground">11 dates in 2026</span>
          </div>
        </Card>

        {/* Row 62 — plan card, `selected`: radius 16, 1px brand border, 3px brand ring. */}
        <Card selected className={cn(PANEL, "gap-3.5 px-5")}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-bold">Pro</span>
            <Badge tone="brand">Current plan</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold tracking-tight">$29</span>
            <span className="text-xs text-muted-foreground">per agent / month</span>
          </div>
          <span className="text-sm leading-[1.6] text-pretty text-muted-foreground">
            SLA targets, saved views, and reporting. Selected state is a 1px brand border plus a 3px
            brand-soft ring — never a colour fill.
          </span>
          <Button variant="neutral" size="touch" className="w-full">
            Your current plan
          </Button>
        </Card>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------------ 11. ALERTS */

const ALERT_PAD = "gap-3 rounded-lg px-4 py-3.5 [&>svg]:size-4.5 [&>svg]:translate-y-0";

function SectionAlerts() {
  return (
    <DocSection
      id="alerts"
      eyebrow="Components"
      title="Alerts & banners"
      description="Soft-tinted surface, matching 1px border, strong-tone text, 18px icon. Inline alerts sit inside the form they belong to; page banners sit directly under the page title. Copy names the fix."
    >
      <div className="flex flex-col gap-3">
        {/* Row 64 — additive `tone` variants on ui/alert.tsx. */}
        <Alert tone="error" className={cn(ALERT_PAD, "has-data-[slot=alert-action]:pr-4")}>
          <TriangleAlert />
          <AlertTitle className="text-sm font-bold">Last payment failed</AlertTitle>
          <AlertDescription className="text-sm leading-[1.6]">
            Card ending 4242 was declined on 22 Jul. Update your payment method to keep the
            workspace active.
          </AlertDescription>
        </Alert>

        <Alert tone="warning" className={ALERT_PAD}>
          <ClockGlyph />
          <AlertTitle className="text-sm font-bold">3 tickets breach in the next hour</AlertTitle>
          <AlertDescription className="text-sm leading-[1.6]">
            All three are unassigned. Assign an owner or extend the policy.
          </AlertDescription>
        </Alert>

        <Alert tone="success" className={ALERT_PAD}>
          <Check />
          <AlertTitle className="text-sm font-bold">Import finished</AlertTitle>
          <AlertDescription className="text-sm leading-[1.6]">
            412 tickets created, 0 skipped. Requesters were matched on email.
          </AlertDescription>
        </Alert>

        <Alert tone="info" className={ALERT_PAD}>
          <InfoGlyph />
          <AlertTitle className="text-sm font-bold">You&rsquo;re viewing as an Agent</AlertTitle>
          <AlertDescription className="text-sm leading-[1.6]">
            Billing and workspace settings are hidden at this role.
          </AlertDescription>
        </Alert>

        {/* Row 100 — billing wall: Card + Alert treatment + Button, with an icon tile (row 63). */}
        <Card className={cn(PANEL, "flex-row items-start gap-3.5 border-destructive-soft px-5")}>
          <span className="flex size-9 flex-none items-center justify-center rounded-md bg-destructive-soft text-destructive-strong">
            <LockGlyph />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-base font-bold">Workspace suspended</span>
            <span className="text-sm leading-[1.65] text-pretty text-muted-foreground">
              The billing wall is the one screen that hides everything else — no queue, no settings,
              no nav. A single recovery action, and nothing to click past it.
            </span>
            <span className="flex flex-wrap gap-2 pt-0.5">
              <Button variant="primary" size="touch">
                Update payment method
              </Button>
              <Button variant="quiet" size="touch">
                Contact support
              </Button>
            </span>
          </div>
        </Card>
      </div>
      <DocCode code={CODE2.alerts} />
    </DocSection>
  );
}

/* --------------------------------------------------------------- 12. SKELETONS */

/** Row 66 — bars are `slate-200` (`--border`) on white, 1.3s pulse (treatments §5.7). */
const BAR = "bg-border";

function SectionSkeletons() {
  return (
    <DocSection
      id="skeletons"
      eyebrow="Components"
      title="Skeletons"
      description={
        <>
          Skeletons mirror the real layout — same row height, same column widths, same card shape —
          so nothing shifts when data lands. Bars are <M>slate-200</M> on white, pulsing opacity
          .45→1 over 1.3s. Never a spinner where a skeleton will do.
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SubHead>Table rows — 8 at 48px, matching the queue</SubHead>
          <Card className={cn(PANEL_FLUSH, "shadow-none")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-12 items-center gap-3.5 border-t border-muted px-4">
                <Skeleton className={cn("size-4 rounded-xs", BAR)} />
                <Skeleton className={cn("h-2.5 w-13 rounded-sm", BAR)} />
                <Skeleton className={cn("h-2.5 flex-1 rounded-sm", BAR)} />
                <Skeleton className={cn("h-4 w-16 rounded-full", BAR)} />
                <Skeleton className={cn("h-4 w-22 rounded-full", BAR)} />
              </div>
            ))}
          </Card>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          <div className="flex flex-col gap-2">
            <SubHead>Stat tiles</SubHead>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <Card
                  key={i}
                  className={cn(PANEL, "gap-2.5 px-4 shadow-none [--card-spacing:--spacing(4)]")}
                >
                  <Skeleton className={cn("h-2 w-17 rounded-sm", BAR)} />
                  <Skeleton className={cn("h-5 w-13 rounded-sm", BAR)} />
                  <Skeleton className={cn("h-2 w-22 rounded-sm", BAR)} />
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SubHead>Mobile ticket cards</SubHead>
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <Card
                  key={i}
                  className={cn(
                    PANEL,
                    "gap-2 rounded-lg px-4 shadow-none [--card-spacing:--spacing(4)]",
                  )}
                >
                  <Skeleton className={cn("h-2.5 w-30 rounded-sm", BAR)} />
                  <Skeleton className={cn("h-3 w-full rounded-sm", BAR)} />
                  <Skeleton className={cn("h-2.5 w-3/5 rounded-sm", BAR)} />
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SubHead>Avatar rows — team, audit</SubHead>
            <Card className={cn(PANEL_FLUSH, "shadow-none")}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-14 items-center gap-3.5 px-4",
                    i > 0 && "border-t border-muted",
                  )}
                >
                  <Skeleton className={cn("size-8 rounded-full", BAR)} />
                  <Skeleton className={cn("h-2.5 flex-1 rounded-sm", BAR)} />
                  <Skeleton className={cn("h-4 w-17 rounded-full", BAR)} />
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
      <DocCode code={CODE2.skeletons} />
    </DocSection>
  );
}

/* ----------------------------------------------------------------- 13. LOADERS */

function SectionLoaders() {
  return (
    <DocSection
      id="loaders"
      eyebrow="Components"
      title="Loaders & progress"
      description="Spinners are for actions the user just triggered; skeletons are for content arriving. Progress bars are only used where the total is known — seat usage, SLA attainment, import steps."
    >
      <Card className={cn(PANEL, "gap-5 px-5")}>
        <div className="flex flex-wrap items-center gap-7">
          <div className="flex flex-col gap-2">
            <SubHead>In-button</SubHead>
            <Button variant="primary" size="touch" loading>
              Sending invites
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <SubHead>Inline · 16px</SubHead>
            {/* Row 68 — COMPOSE: lucide Loader2 + animate-spin. No spinner primitive. */}
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Checking DNS records
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <SubHead>Block · 28px</SubHead>
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-muted pt-4">
          <Eyebrow>Determinate progress</Eyebrow>
          {[
            { label: "Agent seats", value: "6 / 10", pct: 60, fill: "" },
            {
              label: "Urgent SLA met",
              value: "88%",
              pct: 88,
              fill: "*:data-[slot=progress-indicator]:bg-destructive",
            },
            {
              label: "Normal SLA met",
              value: "96%",
              pct: 96,
              fill: "*:data-[slot=progress-indicator]:bg-ring",
            },
          ].map((p) => (
            <div key={p.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary-foreground">{p.label}</span>
                <span className="font-mono font-semibold">{p.value}</span>
              </div>
              {/* Row 69 — stock Progress; tone follows the thing measured, not the value. */}
              <Progress value={p.pct} className={cn("h-2", p.fill)} />
            </div>
          ))}
          <Caption>
            Bar tone follows the thing measured, not the value — priority bars use the priority tone
            so the reports page stays scannable.
          </Caption>
        </div>
      </Card>
    </DocSection>
  );
}

/* -------------------------------------------------------------- 14. NAVIGATION */

/** Design's app nav item: 36px, 8px radius, 14px (treatments §5.5). */
const NAV_ITEM = "flex min-h-9 items-center gap-2.5 rounded-md px-3 text-sm";

function SectionNav() {
  return (
    <DocSection
      id="nav"
      eyebrow="Components"
      title="Navigation"
      description="Sidebar items are role-gated and grouped with uppercase eyebrows. Active is brand-soft fill with a brand-ink label — never a left border. When collapsed to the 72px rail, labels become tooltips."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-3 px-4 [--card-spacing:--spacing(4)]")}>
          <Eyebrow>Sidebar item states</Eyebrow>
          <div className="flex flex-col gap-1">
            <span className={cn(NAV_ITEM, "bg-accent font-semibold text-accent-foreground")}>
              <TicketGlyph />
              Tickets
              <span className="ml-auto font-mono text-xs font-bold">38</span>
            </span>
            <span className={cn(NAV_ITEM, "bg-secondary font-medium text-secondary-foreground")}>
              <UsersGlyph />
              Customers
              <span className="ml-auto text-xs text-slate-400">hover</span>
            </span>
            <span className={cn(NAV_ITEM, "font-medium text-secondary-foreground")}>
              <ChartGlyph />
              Reports
            </span>
            {/* Row 77 — "Soon": muted, non-clickable, labelled. Distinct from denied. */}
            <span className={cn(NAV_ITEM, "cursor-not-allowed font-medium text-slate-400")}>
              <ZapGlyph />
              Automations
              <span className="ml-auto text-xs font-bold tracking-wider text-slate-400 uppercase">
                Soon
              </span>
            </span>
            {/* Row 76 — group eyebrow. */}
            <span className="px-3 pt-2.5 pb-0.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Settings
            </span>
            <span className={cn(NAV_ITEM, "font-medium text-secondary-foreground")}>
              <ClockGlyph />
              SLA policies
            </span>
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-3.5 px-4 [--card-spacing:--spacing(4)]")}>
          <Eyebrow>Collapsed rail · 72px</Eyebrow>
          <div className="flex items-start gap-4">
            <div className="flex w-18 flex-none flex-col items-center gap-2 rounded-lg border border-border bg-card py-2.5">
              <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <TicketGlyph />
              </span>
              <span className="flex size-10 items-center justify-center rounded-md text-secondary-foreground">
                <UsersGlyph />
              </span>
              <span className="flex size-10 items-center justify-center rounded-md text-secondary-foreground">
                <ChartGlyph />
              </span>
            </div>
            <div className="flex flex-col gap-2.5 pt-3">
              <span className="inline-flex w-fit items-center rounded-sm bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background">
                Customers
              </span>
              <Caption>
                Tooltips are fixed-positioned so they escape the scroll container — 0F172A surface,
                7px radius, 12px label.
              </Caption>
            </div>
          </div>
        </Card>
      </div>

      <Card className={cn(PANEL, "gap-5 px-5")}>
        <div className="flex flex-col gap-2.5">
          <Eyebrow>View tabs — counts inline</Eyebrow>
          {/* Row 79 — COMPOSE: Tabs + count Badge; active uses --accent. */}
          <Tabs defaultValue="all">
            <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
              {[
                { id: "all", label: "All open", n: 24 },
                { id: "mine", label: "My tickets", n: 7 },
                { id: "unassigned", label: "Unassigned", n: 3 },
                { id: "breach", label: "Breaching", n: 2 },
                { id: "solved", label: "Solved", n: 12 },
              ].map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="min-h-8.5 gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-semibold text-secondary-foreground transition-colors duration-150 ease-out data-[state=active]:border-primary data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none"
                >
                  {t.label}
                  <span className="font-mono text-xs opacity-60">{t.n}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-muted pt-4">
          <Eyebrow>Pagination</Eyebrow>
          {/* Row 80 — COMPOSE: pagination + rows-per-page. Rendered as the design's pills. */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <div className="flex gap-1">
              {[8, 15, 25, 50].map((n) => (
                <PagePill key={n} active={n === 8}>
                  {n}
                </PagePill>
              ))}
            </div>
            <span className="ml-auto flex items-center gap-1">
              <PageArrow dir="prev" />
              <PagePill>1</PagePill>
              <PagePill active>2</PagePill>
              <PagePill>3</PagePill>
              <span className="inline-flex h-7.5 w-6 items-center justify-center text-[13px] text-slate-400">
                …
              </span>
              <PagePill>17</PagePill>
              <PageArrow dir="next" />
            </span>
          </div>
          <Caption>
            9–16 of 132 tickets · page 2 of 17 · first, last, and the current neighbourhood always
            render; the rest collapse to an ellipsis.
          </Caption>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-muted pt-4">
          <Eyebrow>Breadcrumb & back</Eyebrow>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <a href="#nav" className="font-semibold">
              Tickets
            </a>
            <ChevronDown className="size-3.5 -rotate-90 text-input" />
            <span className="font-mono text-xs">#4821</span>
            <ChevronDown className="size-3.5 -rotate-90 text-input" />
            <span className="font-semibold text-foreground">Duplicate charge on invoice</span>
          </div>
        </div>
      </Card>
    </DocSection>
  );
}

function PagePill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7.5 min-w-7.5 items-center justify-center rounded-md border px-2 font-mono text-xs font-semibold transition-colors duration-150 ease-out",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

function PageArrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-sm border border-border bg-card text-secondary-foreground">
      <ChevronDown className={cn("size-3.5", dir === "prev" ? "rotate-90" : "-rotate-90")} />
    </span>
  );
}

/* Lucide glyphs used above, at the design's nav stroke width. */
const G = {
  className: "size-4.5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function TicketGlyph() {
  return (
    <svg {...G}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}
function UsersGlyph() {
  return (
    <svg {...G}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ChartGlyph() {
  return (
    <svg {...G}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}
function ZapGlyph() {
  return (
    <svg {...G}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}
function ClockGlyph() {
  return (
    <svg {...G}>
      <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2" />
    </svg>
  );
}
function InfoGlyph() {
  return (
    <svg {...G}>
      <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 16v-4M12 8h.01" />
    </svg>
  );
}
function LockGlyph() {
  return (
    <svg {...G} className="size-5">
      <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function Part02() {
  return (
    <>
      <SectionForms />
      <SectionCards />
      <SectionAlerts />
      <SectionSkeletons />
      <SectionLoaders />
      <SectionNav />
    </>
  );
}
