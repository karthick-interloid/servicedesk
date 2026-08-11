"use client";

import { Bar, BarChart, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initials } from "@/features/customers/lib/company-format";
import {
  AGENT_LOAD,
  CSAT,
  FIRST_RESPONSE_TARGET_MIN,
  FIRST_RESPONSE_WEEKS,
  MEDIAN_FIRST_RESPONSE_MIN,
  REPORT_PERIOD_LABEL,
  SLA_ATTAINMENT_DELTA_PTS,
  SLA_ATTAINMENT_PCT,
  SLA_BAR_TONE,
  SLA_BY_PRIORITY,
  TICKETS_SOLVED,
} from "@/features/reports/lib/mock-reports";
import { ticketPriorityTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

import type { ReportsState } from "../types";

/* ---------------------------------------------------------------------------
   Measured off `design-reference/reports--light.png` at 1440 (content box 1128px wide,
   x 282→1409). Every value below is a measurement, not a guess:

     card padding        18px            (skeleton bar left edge, x 300, off border 282)
     card corner         14px            (matches the sibling screens' rounded-[14px])
     KPI row             4 × 273px, gap 12px, card height 105px
     chart row           1.4fr / 1fr, gap 14px      → 650px / 464px at 1440
     section gap         16px            (KPI bottom 331 → chart top 348 → agent top 618)
     agent card          title band 46px · header row 38px · data rows 52px
     bars                64px wide on a 78.29px band = barCategoryGap 18%
     bar baseline        y 559, NO axis line and NO gridlines (verified: pure white below)
     target line         dashed, y 443, label above it and right-aligned

   The only card that is NOT the full section height is the SLA card (241px against the
   chart card's 254px) — the design leaves them ragged, so the grid is items-start.
   --------------------------------------------------------------------------- */

/** 18px card padding, 14px corner — the screen's card recipe, measured. */
const CARD = "gap-0 rounded-[14px] p-[18px]";

/** `statLabelStyle`: 12px / 700 / .06em caps in the muted ink. Same recipe as the queue's
    column headers, which is why the agent table's <th> reuses it verbatim. */
const CAPS =
  "text-xs font-bold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase";

export function ReportsDashboard({ state }: { state: ReportsState }) {
  return (
    <div className="flex flex-col gap-4">
      {/* ---- Page header ------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          {/* The period is a STATIC subtitle. The design draws no date-range control on
              this screen — the capture report records no <select> in the content region —
              so there is nothing here to re-slice the mock. See REPORTS-DIFF.md. */}
          <p className="text-sm text-muted-foreground">{REPORT_PERIOD_LABEL}</p>
        </div>

        {/* Presentational: the design wires no download, so this exports nothing. */}
        <Button variant="neutral" size="touch" className="text-brand-accent">
          Export CSV
        </Button>
      </div>

      {state === "loading" ? <ReportsSkeleton /> : <ReportsContent />}
    </div>
  );
}

function ReportsContent() {
  return (
    <>
      {/* ---- KPI tiles --------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="SLA attainment"
          value={`${SLA_ATTAINMENT_PCT.toFixed(1)}%`}
          foot={`${SLA_ATTAINMENT_DELTA_PTS > 0 ? "+" : ""}${SLA_ATTAINMENT_DELTA_PTS} pts vs last month`}
        />
        <StatTile
          label="Median first response"
          value={`${MEDIAN_FIRST_RESPONSE_MIN}m`}
          foot="Target 1h on Pro"
        />
        <StatTile
          label="Tickets solved"
          value={TICKETS_SOLVED.toLocaleString("en-US")}
          foot="Last 30 days"
        />
        <StatTile
          label="CSAT"
          value={`${CSAT.score} / ${CSAT.outOf}`}
          foot={`${CSAT.ratings} ratings`}
        />
      </div>

      {/* ---- Chart + SLA breakdown --------------------------------------- */}
      <div className="grid grid-cols-1 items-start gap-[14px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FirstResponseChart />
        <SlaByPriority />
      </div>

      {/* ---- Agent load -------------------------------------------------- */}
      <AgentLoad />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   KPI tiles
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * The figure is Inter, not mono.
 *
 * treatments.md §4 records the stat-tile figure as `font-mono text-2xl` from the design
 * system page's Cards §stat tiles. This screen contradicts it: "94.2%", "1,204" and
 * "4.6 / 5" are all measurably proportional Inter at 24px/700. The screen wins over the
 * specimen — logged in REPORTS-DIFF.md § Deviations.
 */
function StatTile({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <Card className={cn(CARD, "gap-0")}>
      <span className={CAPS}>{label}</span>
      <span className="mt-2 text-2xl leading-none font-bold tracking-tight text-foreground">
        {value}
      </span>
      <span className="mt-2.5 text-xs text-muted-foreground">{foot}</span>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Median first response — the one chart on the screen
   ══════════════════════════════════════════════════════════════════════════════ */

const chartConfig = {
  minutes: { label: "Median first response", color: "var(--brand-accent)" },
} satisfies ChartConfig;

/**
 * A BAR chart — the design's own type, verified bar by bar in the capture (eight solid
 * 64px columns on a flat baseline, tops rounded 4px, one value label above each). It is
 * NOT hand-built SVG: recharts computes the geometry from FIRST_RESPONSE_WEEKS.
 *
 * Chrome, all measured rather than assumed:
 *   · no CartesianGrid and no axis line — the pixels below the baseline are pure white
 *   · a dashed ReferenceLine at the 60m target, its label above the line and right-aligned
 *   · the y domain runs to 68, not to dataMax, so the 58m bar clears the target line by
 *     the ~5px the design leaves and the label above it still fits inside the plot
 *   · axis ticks are --chart-axis (#94A3B8), one step lighter than the muted ink every
 *     other caption uses; the override lands via tailwind-merge over ChartContainer's own
 *     `fill-muted-foreground` rule, which is why it is written as the same arbitrary
 *     variant rather than as a `tick={{ fill }}` prop (a class beats an SVG attribute).
 *
 * The tooltip is treatments.md §5.9's inverse surface, applied as a className rather than
 * by editing ui/chart.tsx. The design's static capture cannot show it.
 */
function FirstResponseChart() {
  return (
    <Card className={CARD}>
      <span className={CAPS}>Median first response</span>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Minutes, last 8 weeks · target {FIRST_RESPONSE_TARGET_MIN}m
      </p>

      <ChartContainer
        config={chartConfig}
        className="mt-1 aspect-auto h-[200px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-chart-axis"
      >
        <BarChart
          accessibilityLayer
          data={[...FIRST_RESPONSE_WEEKS]}
          margin={{ top: 28, right: 0, bottom: 0, left: 0 }}
          barCategoryGap="18%"
        >
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tickMargin={11}
            height={30}
            className="font-mono text-xs"
          />
          <YAxis hide domain={[0, 68]} />

          <ReferenceLine
            y={FIRST_RESPONSE_TARGET_MIN}
            stroke="var(--border)"
            strokeDasharray="4 4"
            label={{
              value: `${FIRST_RESPONSE_TARGET_MIN}m target`,
              position: "insideTopRight",
              offset: 8,
              fill: "var(--muted-foreground)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
          />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                className="border-transparent bg-foreground text-background [&_.text-foreground]:text-background [&_.text-muted-foreground]:text-background/70"
                formatter={(value) => `${value}m`}
              />
            }
          />

          <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="minutes"
              position="top"
              offset={8}
              className="fill-muted-foreground font-mono"
              fontSize={12}
              formatter={(value) => `${value}m`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SLA attainment by priority — bars, but not a chart
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Deliberately NOT ui/chart.tsx. The design draws four labelled meters — badge, figure,
 * count, track — one per priority, with no axes, no scale and no shared plot. That is the
 * progress-bar treatment (treatments.md §5.8), not a chart, and rendering it through
 * recharts would put a plot area and a category axis around four independent percentages.
 *
 * `aria-hidden` on the track: the row already states "88% met · 142 tickets" in text, so
 * the meter is decoration over a figure a screen reader has read. Nothing on this card is
 * carried by colour alone.
 */
function SlaByPriority() {
  return (
    <Card className={CARD}>
      <span className={CAPS}>SLA attainment by priority</span>

      <div className="mt-[17px] flex flex-col gap-[14px]">
        {SLA_BY_PRIORITY.map((row) => (
          <div key={row.priority} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Badge tone={ticketPriorityTone[row.priority]}>{row.label}</Badge>
              <span className="text-[15px] font-bold text-foreground">{row.metPct}% met</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {row.tickets} tickets
              </span>
            </div>

            <div aria-hidden className="h-2 w-full rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", SLA_BAR_TONE[row.priority])}
                style={{ width: `${row.metPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Agent load
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * A REAL <table>, unlike the customers list.
 *
 * Both screens report `tables: 0` in the capture — the design builds neither out of
 * `<table>` — but the two are not the same shape. Customers drops three of its five cells
 * below `md`, which is a grid job. Agent load keeps all five at every width and the design
 * lets it scroll instead (`xScroll: true` at mobile, false everywhere above), which is
 * exactly what ui/table.tsx's own overflow container does. So this one gets the real
 * element and the row/column semantics that come with it.
 *
 * The header row is hidden below `sm`, as the design hides it — but `sr-only`, not
 * `hidden`: the cells it labels are still THERE at mobile (they scroll into view), so
 * removing their labels from the accessibility tree would strip meaning the design only
 * ever removed from the paint. Logged in REPORTS-DIFF.md § Deviations.
 */
function AgentLoad() {
  return (
    <Card className="gap-0 rounded-[14px] p-0">
      <div className="flex h-[46px] items-center border-b border-border px-[18px]">
        <h2 className="text-[15px] font-bold text-foreground">Agent load</h2>
      </div>

      <Table className="min-w-[560px]">
        <TableHeader className="max-sm:sr-only">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(CAPS, "h-[38px] w-auto bg-muted/40 px-4")}>Agent</TableHead>
            <TableHead className={cn(CAPS, "h-[38px] w-[102px] bg-muted/40 px-0")}>Open</TableHead>
            <TableHead className={cn(CAPS, "h-[38px] w-[119px] bg-muted/40 px-0")}>
              Solved
            </TableHead>
            <TableHead className={cn(CAPS, "h-[38px] w-[140px] bg-muted/40 px-0")}>
              Median 1st reply
            </TableHead>
            <TableHead className={cn(CAPS, "h-[38px] w-[105px] bg-muted/40 px-0")}>
              SLA met
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {AGENT_LOAD.map((row) => (
            <TableRow key={row.id} className="h-[52px]">
              <TableCell className="px-4">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background"
                  >
                    {initials(row.fullName)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{row.fullName}</span>
                </span>
              </TableCell>
              <TableCell className="px-0 text-sm text-secondary-foreground tabular-nums">
                {row.open}
              </TableCell>
              <TableCell className="px-0 text-sm text-secondary-foreground tabular-nums">
                {row.solved}
              </TableCell>
              <TableCell className="px-0 font-mono text-sm text-secondary-foreground">
                {row.medianFirstReplyMin}m
              </TableCell>
              <TableCell className="px-0 text-sm font-semibold text-foreground tabular-nums">
                {row.slaMetPct}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Loading
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * The design's `stLoading`: EIGHT identical tiles on the same four-column grid, two rows
 * of four — not a skeleton of the real layout. The chart, the SLA card and the table are
 * absent entirely, so nothing here previews their shape. Measured: tile 68px tall, 18px
 * padding, two bars 10px tall (70px then 120px wide) with 12px between them, 14px between
 * the two rows against the grid's 12px columns.
 */
function ReportsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i} className="h-[68px] gap-3 rounded-[14px] p-[18px]">
          <Skeleton className="h-2.5 w-[70px] rounded-full" />
          <Skeleton className="h-2.5 w-[120px] rounded-full" />
        </Card>
      ))}
    </div>
  );
}
