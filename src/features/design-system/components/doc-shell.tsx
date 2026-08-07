import { NAV_GROUPS, MASTHEAD_STATS } from "@/features/design-system/data";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * D1 masthead + D2 section header + D3 anchor nav + D7 reference table + D8 code block,
 * plus the page grid. components-map.md §Doc-page rows D1, D2, D3, D7, D8.
 * Palette utilities are permitted in this section only (see the boundary note);
 * treatments in docs/treatments.md §3.7.
 */

/** D1 — doc masthead band. Layout band, not a primitive (row 78 / 97 precedent). */
export function DocMasthead() {
  return (
    <header className="border-b border-slate-800 bg-slate-950 px-6 pt-9 pb-8 md:px-10">
      <div className="mx-auto flex max-w-310 flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-green-400" />
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Interloid · ServiceDesk Pro
          </span>
        </div>
        <h1 className="text-4xl leading-[1.15] font-bold tracking-tight text-slate-50">
          Design system
        </h1>
        <p className="max-w-[74ch] text-base leading-[1.65] text-pretty text-slate-400">
          Every token, primitive, and pattern used across the 43 ServiceDesk Pro screens — with the
          shadcn/ui token name and the Next.js snippet for each. This is the reference the React
          export in <span className="font-mono text-sm text-slate-300">react/</span> is built
          against.
        </p>
        <div className="flex flex-wrap gap-5 pt-2">
          {MASTHEAD_STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="font-mono text-lg font-bold text-slate-50">{s.figure}</span>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

/** D3 — 184px sticky in-page anchor nav. Never a Sheet; see the row's note. */
export function DocNav() {
  return (
    <nav className="top-6 flex flex-col gap-0.5 lg:sticky">
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <span
            className={cn(
              "px-2.5 pb-2 text-xs font-bold tracking-widest text-slate-400 uppercase",
              i > 0 && "pt-3.5",
            )}
          >
            {group.label}
          </span>
          {group.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm px-2.5 py-1.5 text-sm font-medium text-secondary-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * D2 — doc section header. Row 97 fails on cardinality only ("one per screen"); this
 * repeats 28×, has no actions slot and no breadcrumb.
 */
export function DocSection({
  id,
  eyebrow,
  title,
  children,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          {eyebrow}
        </span>
        <h2 className="text-2xl leading-[1.2] font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-[74ch] text-sm leading-[1.65] text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Inline mono span — the design's own inline-code treatment inside prose. */
export function M({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-secondary-foreground">{children}</span>;
}

/** Uppercase group eyebrow inside a panel — `text-xs/700/tracking-widest`, slate-400. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">{children}</span>
  );
}

/** 12px bold label above a specimen block. */
export function SubHead({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold text-secondary-foreground">{children}</span>;
}

/** 14px bold heading plus a 12px slate-400 aside, on one baseline. */
export function GroupHead({ title, note }: { title: string; note?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2.5">
      <h3 className="text-sm font-bold">{title}</h3>
      {note ? <span className="text-xs text-slate-400">{note}</span> : null}
    </div>
  );
}

/** 12px muted caption under a specimen. */
export function Caption({ children }: { children: React.ReactNode }) {
  return <span className="text-xs leading-[1.55] text-muted-foreground">{children}</span>;
}

/** The page grid: 184px nav + content, capped at the design's 1240px and centred. */
export function DocLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <DocMasthead />
      <div className="mx-auto grid max-w-310 grid-cols-1 items-start gap-11 px-6 pt-8 pb-24 md:px-10 lg:grid-cols-[184px_minmax(0,1fr)]">
        <DocNav />
        <main className="flex min-w-0 flex-col gap-15">{children}</main>
      </div>
    </div>
  );
}

/** D8 — code block. Utility-styled native <pre>; no component file (row 73 precedent). */
export function DocCode({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-xs leading-[1.75] text-slate-300">
      {code}
    </pre>
  );
}

/** The design's panel recipe on row 59's Card: 1px --border, radius 14, shadow-xs at rest.
 *  `ring-0` cancels radix-nova's own `ring-1 ring-foreground/10` hairline — see DEFERRED. */
export const PANEL = "border border-border shadow-xs ring-0 [--card-spacing:--spacing(5)]";

/** The same shell with no vertical padding, for table- and list-bodied panels. */
export const PANEL_FLUSH = `${PANEL} gap-0 py-0`;

/**
 * D7 — reference table. Stock `Table` inside row 59's Card shell, eight times over.
 * `cols` carries the design's own fixed track widths as Tailwind width utilities.
 */
export function RefTable<T>({
  head,
  cols,
  rows,
  render,
  keyOf,
  align = "middle",
}: {
  head: string[];
  cols: string[];
  rows: readonly T[];
  render: (row: T) => React.ReactNode[];
  keyOf: (row: T) => string;
  /** The design's own `align-items` on each table: `center` by default, `start` where a
   *  row's cells are long-form prose (roles, API, custom variables, duplicate audit). */
  align?: "middle" | "top";
}) {
  return (
    <Card className={cn(PANEL_FLUSH)}>
      {/* `table-fixed` is what makes the `cols` widths real. Without it the browser
         auto-sizes from content and the design's fixed tracks are ignored entirely. */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-b-0 bg-background hover:bg-background">
            {head.map((h, i) => (
              <TableHead
                key={h}
                className={cn(
                  "h-auto px-4 py-2.5 align-bottom text-xs font-bold tracking-wider whitespace-normal text-slate-400 uppercase",
                  cols[i],
                )}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={keyOf(r)} className="border-t border-muted">
              {render(r).map((cell, i) => (
                <TableCell
                  key={i}
                  className={cn(
                    // Cells wrap. Stock TableCell is `whitespace-nowrap`, which under
                    // `table-fixed` overflows a long token into the next track instead
                    // of breaking it across two lines the way the design does.
                    "px-4 py-2.5 whitespace-normal",
                    align === "top" ? "align-top" : "align-middle",
                    cols[i],
                  )}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export { Separator };
