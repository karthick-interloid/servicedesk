import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { openTicketCount } from "@/features/customers/lib/company-tickets";
import { initials } from "@/features/customers/lib/company-format";

import { PLAN_TONE, type CustomerCompany } from "../types";

/* ---------------------------------------------------------------------------
   The design lays this out as a CSS GRID, not a <table> — the capture report records
   `tables: 0` for this screen. `ui/table.tsx` is therefore NOT used: forcing a real table
   here would mean fighting `table-fixed` to reproduce the design's `custRowStyle` tracks,
   and would put a table role on something the design never made one.

   Tracks, transcribed from `custRowStyle` / `custHeadStyle`:
     < 768   minmax(0,1fr) 74px                                  (company · plan)
     >= 768  minmax(0,1.3fr) 110px 84px 74px minmax(0,1fr)       (+ open · csat · owner)

   That is the whole ladder — the design drops three cells in one step at `mobile` and
   nothing else moves. No band is broken (`xScroll` is false at every width above mobile),
   so unlike the queue's 1024-1279 this needed no redesign.
   --------------------------------------------------------------------------- */
const GRID =
  "grid grid-cols-[minmax(0,1fr)_74px] items-center gap-3 md:grid-cols-[minmax(0,1.3fr)_110px_84px_74px_minmax(0,1fr)]";

/** `thStyle`: 12px / 700 / .06em caps in the muted ink. */
const TH = "text-xs font-bold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase";

export function CustomersList({ companies }: { companies: CustomerCompany[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* ---- Page header ------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Companies and the people who raise tickets from them.
          </p>
        </div>

        {/* Presentational: the design draws no Add-company form, so this opens nothing. */}
        <Button
          size="touch"
          className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          Add company
        </Button>
      </div>

      {companies.length === 0 ? (
        /* ---- Empty — DRAWN BY THE DESIGN (`stEmpty`), not authored ------- */
        <Card className="items-center gap-3 rounded-[14px] px-6 py-11 text-center">
          <h2 className="text-base font-bold">No companies yet</h2>
          <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
            Companies are created automatically from requester email domains, or add one by hand.
          </p>
          <Button
            size="touch"
            className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Add company
          </Button>
        </Card>
      ) : (
        <Card className="gap-0 rounded-[14px] p-0">
          {/* Header row is hidden below md, exactly as the design's `notMobile` gate does.
              Hidden, not emptied — the cells it labels are themselves gone at that width. */}
          <div
            className={`${GRID} hidden h-[38px] border-b border-border bg-muted/40 px-4 md:grid`}
          >
            <span className={TH}>Company</span>
            <span className={TH}>Plan</span>
            <span className={TH}>Open</span>
            <span className={TH}>CSAT</span>
            <span className={TH}>Account owner</span>
          </div>

          {companies.map((company) => (
            /* The whole row is the link — the design makes the row itself clickable
               (`onClick="{{ c.go }}"` with `cursor:pointer`). A real <Link> rather than an
               onClick handler, so the row keeps middle-click, open-in-new-tab and a status
               bar URL, and so this file stays a Server Component. */
            <Link
              key={company.id}
              href={`/customers/${company.id}`}
              className={`${GRID} border-t border-muted px-4 py-3.5 transition-colors hover:bg-muted/40 md:min-h-15 md:py-0`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {/* 8px, not the 10px `rounded-lg` step — the design pins this one at 8. */}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-muted text-xs font-bold text-secondary-foreground">
                  {initials(company.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {company.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{company.domain}</span>
                </span>
              </span>

              {/* No dot: a plan answers "what kind is this", not "what state is this in"
                  (treatments §3.1), and the capture shows the pill without one. */}
              <span>
                <Badge tone={PLAN_TONE[company.plan]}>{company.plan}</Badge>
              </span>

              {/* The three cells the design drops below md. Hidden, never disabled. */}
              <span className="hidden font-mono text-sm text-secondary-foreground md:inline">
                {openTicketCount(company)}
              </span>
              <span className="hidden font-mono text-sm text-secondary-foreground md:inline">
                {company.csat.toFixed(1)}
              </span>
              <span className="hidden truncate text-sm text-secondary-foreground md:inline">
                {company.accountOwner}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
