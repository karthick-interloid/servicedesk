import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { SLA_STATUS_TONE, type SlaPolicy } from "../types";

/** `thStyle` / `thWideStyle`: 12px / 700 / .06em caps, the wide one with a 78px floor. */
const TH = "text-xs font-bold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase";

export function SlaList({ policies }: { policies: SlaPolicy[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* ---- Page header ------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">SLA policies</h1>
          <p className="text-sm text-muted-foreground">
            Targets are measured against your business hours.
          </p>
        </div>

        <Button
          size="touch"
          asChild
          className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          <Link href="/settings/sla/new">New policy</Link>
        </Button>
      </div>

      {policies.length === 0 ? (
        /* ---- Empty — DRAWN BY THE DESIGN (`stEmpty`), copy verbatim ------ */
        <Card className="items-center gap-3 rounded-[14px] px-6 py-11 text-center">
          <h2 className="text-base font-bold">No SLA policies yet</h2>
          <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
            Without a policy, nothing in the queue shows a countdown. Start with one default policy
            and refine it later.
          </p>
          <Button
            size="touch"
            asChild
            className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            <Link href="/settings/sla/new">Create first policy</Link>
          </Button>
        </Card>
      ) : (
        <Card className="gap-0 rounded-[14px] p-0">
          {/* Header row hidden below md, per the design's `notMobile` gate. The design lays
              it out as flex with the right pair pushed by `margin-left:auto`, not a grid —
              so the row below matches it rather than declaring tracks. */}
          <div className="hidden h-[38px] items-center gap-3 border-b border-border bg-muted/40 px-4 md:flex">
            <span className={TH}>Policy</span>
            <span className="ml-auto flex items-center gap-4">
              <span className={TH}>Applied to</span>
              <span className={`${TH} min-w-[78px]`}>Status</span>
            </span>
          </div>

          {policies.map((policy) => (
            /* The design makes the whole row clickable (`onClick="{{ p.open }}"`,
               `cursor:pointer`). A real <Link> keeps middle-click and open-in-new-tab. */
            <Link
              key={policy.id}
              href={`/settings/sla/${policy.id}`}
              className="flex flex-wrap items-center gap-3 border-t border-muted p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{policy.name}</span>
                {/* ⚠ `appliesTo` has no column — see ../types.ts. */}
                <span className="text-xs text-muted-foreground">{policy.appliesTo}</span>
              </div>

              <span className="font-mono text-xs text-muted-foreground">
                {policy.appliedTicketCount.toLocaleString("en-US")} tickets
              </span>

              {/* Dot present: a status answers "what state is this in" (treatments §3.1),
                  and the capture shows the leading dot on both Active and Paused. */}
              <span className="min-w-[76px]">
                <Badge tone={SLA_STATUS_TONE[policy.status]} dot>
                  {policy.status}
                </Badge>
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
