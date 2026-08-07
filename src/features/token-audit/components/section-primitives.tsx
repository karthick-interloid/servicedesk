"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Stock primitives, inheriting the token layer with NO custom classes.
 *
 * The one exception is flagged inline: the four status subtle treatments, which
 * have no stock variant and therefore must carry classes to exist at all.
 *
 * When something here looks wrong, the raw swatch in Section A above tells you
 * whether the token or the component's usage of it is at fault.
 */

function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {note ? <p className="max-w-[74ch] text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-muted py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;
const BADGE_VARIANTS = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

// Class strings are written out in full: Tailwind scans source statically, so an
// interpolated `bg-${tone}` would never be generated.
const STATUS_SUBTLE = [
  {
    tone: "success",
    label: "Solved",
    cls: "bg-success-soft text-success-strong ring-success/25",
    dot: "bg-success",
  },
  {
    tone: "warning",
    label: "1h 12m left",
    cls: "bg-warning-soft text-warning-strong ring-warning/25",
    dot: "bg-warning",
  },
  {
    tone: "info",
    label: "Awaiting triage",
    cls: "bg-info-soft text-info-strong ring-info/25",
    dot: "bg-info",
  },
  {
    tone: "error",
    label: "Breached 26m",
    cls: "bg-destructive-soft text-destructive-strong ring-destructive/25",
    dot: "bg-destructive",
  },
] as const;

export function SectionPrimitives() {
  return (
    <div className="flex flex-col gap-10">
      <Block
        title="Button — every variant and size, no custom classes"
        note="Design wants: secondary = bg-card + border-input · destructive = solid fill with white label · sizes h-11 md:h-8 / h-11 md:h-10 / h-12 with a 44px mobile floor · hover:bg-primary/90 · press scale .98. None of that is reachable from the token layer."
      >
        {BUTTON_VARIANTS.map((v) => (
          <Row key={v} label={v}>
            {BUTTON_SIZES.map((s) => (
              <Button key={s} variant={v} size={s}>
                New ticket
              </Button>
            ))}
            <Button variant={v} disabled>
              Disabled
            </Button>
          </Row>
        ))}
      </Block>

      <Block
        title="Badge — every variant, then the four status subtle treatments"
        note="The six stock variants are shape-only; the design's badge is a tone system (soft surface + strong text + 25% inset ring + rounded-full). The second block is the only place on this page that adds classes to a primitive, because no stock variant expresses it."
      >
        <Row label="stock variants">
          {BADGE_VARIANTS.map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </Row>
        <Row label="status subtle — needs classes, no stock variant exists">
          {STATUS_SUBTLE.map((s) => (
            <span
              key={s.tone}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${s.cls}`}
            >
              {s.label}
            </span>
          ))}
        </Row>
        <Row label="status subtle — same tones, with the leading dot the design adds for state">
          {STATUS_SUBTLE.map((s) => (
            <span
              key={s.tone}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${s.cls}`}
            >
              <span className={`size-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </Row>
      </Block>

      <Block
        title="Card — header, content, footer"
        note="Design's card recipe: bg-card, 1px --border, 14px radius, shadow-xs at rest, elevation only on hover or selection."
      >
        <div className="flex flex-wrap gap-4">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Business hours</CardTitle>
              <CardDescription>Mon – Fri · 09:00 – 18:30 IST</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Agents are paged outside these hours only for Urgent tickets with a breached
                first-response target.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Save changes</Button>
            </CardFooter>
          </Card>
        </div>
      </Block>

      <Block
        title="Input + Label, Checkbox"
        note="Design wants h-11 md:h-10 and rounded-sm (6px) with a --input border; radix-nova ships h-8 rounded-lg. Focus is the design's two-part indicator — border-ring plus a 3px halo — but at ring/50 here, not the specified ring/30."
      >
        <Row label="text field">
          <div className="flex w-72 flex-col gap-2">
            <Label htmlFor="tok-email">Work email</Label>
            <Input id="tok-email" type="email" placeholder="you@northwind.io" />
          </div>
          <div className="flex w-72 flex-col gap-2">
            <Label htmlFor="tok-invalid">Password</Label>
            <Input id="tok-invalid" type="password" defaultValue="hunter2hunter2" aria-invalid />
          </div>
          <div className="flex w-72 flex-col gap-2">
            <Label htmlFor="tok-disabled">Seats billed</Label>
            <Input id="tok-disabled" defaultValue="6" disabled />
          </div>
        </Row>
        <Row label="checkbox">
          <div className="flex items-center gap-2">
            <Checkbox id="tok-keep" defaultChecked />
            <Label htmlFor="tok-keep">Keep me signed in</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="tok-sla" />
            <Label htmlFor="tok-sla">Email me when an SLA is about to breach</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="tok-off" disabled />
            <Label htmlFor="tok-off">Disabled</Label>
          </div>
        </Row>
      </Block>

      <Block
        title="Select"
        note="Native-feeling trigger styled to match Input; content inherits --popover."
      >
        <Row label="closed trigger">
          <div className="w-72">
            <Select defaultValue="agent">
              <SelectTrigger id="tok-role">
                <SelectValue placeholder="Invite as" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="billing">Billing Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Row>
      </Block>

      <Block
        title="Tabs"
        note="Design's view tabs are 34px pills: active = 1px brand border + brand-soft fill + brand ink. Stock TabsList is a different shape entirely — a token-layer pass cannot close that."
      >
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All open</TabsTrigger>
            <TabsTrigger value="mine">My tickets</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <p className="pt-3 text-sm">24 tickets in this view.</p>
          </TabsContent>
          <TabsContent value="mine">
            <p className="pt-3 text-sm">7 tickets assigned to you.</p>
          </TabsContent>
          <TabsContent value="unassigned">
            <p className="pt-3 text-sm">3 tickets with no owner.</p>
          </TabsContent>
        </Tabs>
      </Block>

      <Block
        title="DropdownMenu — held open"
        note="THE trap-1 exhibit. --accent is the menu-item highlight role in radix-nova (dropdown-menu, context-menu, select, combobox — nothing else). Hover or focus an item: it should be brand-soft #DCFCE7 with #166534 ink, which is exactly what the design's own column picker renders."
      >
        <div className="min-h-72">
          <DropdownMenu open modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns · 3</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>Requester</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Assignee</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Channel</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Updated</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Reset to default</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Block>

      <Block
        title="Dialog"
        note="Scrim is the design's rgba(15,23,42,.45); the panel should sit at shadow-xl with a 14px radius."
      >
        <Row label="trigger">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this SLA policy?</DialogTitle>
                <DialogDescription>
                  14 open tickets currently use Urgent — 1h first response. They&rsquo;ll fall back
                  to the default policy and their targets will be recalculated.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Keep it</Button>
                </DialogClose>
                <Button variant="destructive">Delete policy</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Row>
      </Block>
    </div>
  );
}
