import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { customerSince, initials } from "@/features/customers/lib/company-format";
import { openTicketCount, ticketsForCompany } from "@/features/customers/lib/company-tickets";
import { STATUS_LABEL } from "@/features/tickets/types";
import { ticketStatusTone } from "@/lib/badge-tones";

import { PLAN_TONE, type CustomerCompany } from "../types";

/** `statGrid`: 1 column below md, 2 to lg, 4 above — measured off the 375/768/1440 captures. */
const STAT_GRID = "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4";

/** `twoCol`: stacked below lg, an even split above. */
const TWO_COL = "grid grid-cols-1 items-start gap-4 lg:grid-cols-2";

/** The card headers on Contacts / Recent tickets: 14px/700 over a full-width rule. */
const CARD_TITLE = "border-b border-border px-4 py-3.5 text-sm font-bold text-foreground";

export function CustomerRecord({ company }: { company: CustomerCompany }) {
  const tickets = ticketsForCompany(company);
  const openCount = openTicketCount(company);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ---- Back link — the design's own affordance, 44px tall ------------ */}
      <Link
        href="/customers"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand-accent"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Customers
      </Link>

      {/* ---- Header ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="flex size-13 shrink-0 items-center justify-center rounded-[14px] bg-foreground text-lg font-bold text-background">
          {initials(company.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <span className="text-sm text-muted-foreground">
            {company.domain} · {customerSince(company.customerSince)}
          </span>
        </div>
        <span className="ml-auto">
          <Badge tone={PLAN_TONE[company.plan]}>{company.plan}</Badge>
        </span>
      </div>

      {/* ---- Stats -------------------------------------------------------- */}
      <div className={STAT_GRID}>
        {/* Open tickets is DERIVED from the same rows the Recent-tickets card lists, so the
            number and the list can never disagree. Lifetime is mock-only — see types.ts. */}
        <Stat label="Open tickets" value={openCount} />
        <Stat label="Lifetime tickets" value={company.lifetimeTickets} />
        <Stat label="CSAT" value={`${company.csat.toFixed(1)} / 5`} />
        <Stat label="Account owner" value={company.accountOwner} size="sm" />
      </div>

      {/* ---- Contacts + Recent tickets ------------------------------------ */}
      <div className={TWO_COL}>
        <Card className="gap-0 rounded-[14px] p-0">
          <div className={CARD_TITLE}>Contacts</div>
          {company.contacts.map((person) => (
            <div
              key={person.id}
              className="flex flex-wrap items-center gap-3 border-t border-muted px-4 py-3.5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">{person.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{person.email}</span>
              </div>
              {/* NOT a Badge: the design gives this an 8px radius and no ring, unlike every
                  tone pill on the screen. It is the same chip treatment the ticket detail
                  uses for tags. */}
              <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-secondary-foreground">
                {person.role}
              </span>
            </div>
          ))}
        </Card>

        <Card className="gap-0 rounded-[14px] p-0">
          <div className={CARD_TITLE}>Recent tickets</div>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex flex-wrap items-center gap-3 border-t border-muted px-4 py-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-mono text-xs text-muted-foreground">#{ticket.number}</span>
                  <span className="text-sm font-semibold text-foreground">{ticket.subject}</span>
                </div>
                {/* Same tone source as the queue, so a status never means two things. */}
                <Badge tone={ticketStatusTone[ticket.status]} dot>
                  {STATUS_LABEL[ticket.status]}
                </Badge>
              </Link>
            ))
          ) : (
            /* The design's own `custNoTickets` branch, verbatim. */
            <p className="px-4 py-7 text-center text-sm text-muted-foreground">
              No tickets from this company yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

/** One stat card. 12px/700 caps label over the value; the design uses 20px except for the
    account owner, which it sets at 16px/600 because a name is not a number. */
function Stat({
  label,
  value,
  size = "lg",
}: {
  label: string;
  value: string | number;
  size?: "lg" | "sm";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-border bg-card p-4">
      <span className="text-xs font-bold tracking-[0.05em] text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={
          size === "lg"
            ? "text-xl font-bold text-foreground"
            : "text-base font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
