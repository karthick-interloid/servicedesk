import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BRAND_RAMP,
  BREAKPOINT_ROWS,
  CODE,
  ELEVATION_ROWS,
  MOTION_ROWS,
  NEUTRAL_RAMP,
  RADIUS_SCALE,
  SHADCN_ROWS,
  SPACE_SCALE,
  SPECIAL_SURFACES,
  STATUS_TRIPLES,
  TYPE_ROWS,
} from "@/features/design-system/data";
import {
  Caption,
  DocCode,
  DocSection,
  Eyebrow,
  GroupHead,
  M,
  PANEL,
  PANEL_FLUSH,
  RefTable,
} from "@/features/design-system/components/doc-shell";
import { priorityTone, statusTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

/* Sections 1–8: Color · shadcn tokens · Typography · Spacing & radius ·
   Elevation & motion · Breakpoints · Buttons · Badges & tags. */

/* ------------------------------------------------------------------- 1. COLOR */

function SectionColor() {
  return (
    <DocSection
      id="color"
      eyebrow="Foundations"
      title="Color"
      description={
        <>
          One brand green carries every action. Neutrals are slate-tinted and text is never pure
          black. Status is expressed with a three-part semantic triple — <M>base</M> for dots and
          fills, <M>soft</M> for the pill surface, <M>strong</M> for its text.
        </>
      }
    >
      <Card className={cn(PANEL, "gap-5 px-5")}>
        <div className="flex flex-col gap-3">
          <GroupHead
            title="Brand"
            note={
              <>
                The whole ramp derives from one accent hex. Variable names keep the
                design-system&rsquo;s <M>--blue-*</M> keys.
              </>
            }
          />
          {/* D4 — colour swatch grid. Chips paint from a token, never a hex. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(152px,1fr))] gap-3">
            {BRAND_RAMP.map((s) => (
              <div key={s.value} className="flex flex-col gap-1">
                <span className={cn("h-14 rounded-md border border-foreground/6", s.paint)} />
                <span className="text-xs font-semibold">{s.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.value}</span>
                <span className="font-mono text-xs text-slate-400">{s.token}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-5">
          <GroupHead
            title="Neutrals"
            note={
              <>
                Slate-tinted. Never <M>gray-*</M> or warm grey.
              </>
            }
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
            {NEUTRAL_RAMP.map((s) => (
              <div key={s.value} className="flex flex-col gap-1">
                <span className={cn("h-11 rounded-sm border border-foreground/6", s.paint)} />
                <span className="font-mono text-xs text-secondary-foreground">{s.value}</span>
                <span className="text-xs text-slate-400">{s.caption}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-5">
          <GroupHead
            title="Status triples"
            note="Five tones, no others. Each pair must survive the squint test side by side."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(208px,1fr))] gap-3.5">
            {STATUS_TRIPLES.map((t) => (
              <div
                key={t.tone}
                className="flex flex-col items-start gap-2 rounded-md border border-border p-3.5"
              >
                <span className="flex w-full gap-1.5">
                  <span className={cn("h-8 flex-1 rounded-sm", t.base)} />
                  <span
                    className={cn("h-8 flex-1 rounded-sm border border-foreground/5", t.soft)}
                  />
                  <span className={cn("h-8 flex-1 rounded-sm", t.strong)} />
                </span>
                <Badge tone={t.tone} dot>
                  {t.sample}
                </Badge>
                <span className="font-mono text-xs leading-[1.6] text-muted-foreground">
                  {t.primitives}
                  <br />
                  {t.names}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-5">
          <span className="border-t border-muted pt-4 text-xs leading-[1.65] text-pretty text-muted-foreground">
            Two consequences of a green brand, resolved deliberately.{" "}
            <span className="font-semibold text-foreground">--info is indigo</span>, not a brand
            derivative — when info shared the brand hue, an informational pill and an active-state
            pill were indistinguishable. And{" "}
            <span className="font-semibold text-foreground">
              --success shares the brand&rsquo;s green ramp on purpose
            </span>{" "}
            rather than introducing a second, near-identical green: two greens 20° apart are
            indistinguishable at 12px, so the system carries one. Status is disambiguated by the
            mapping instead — <M>New</M> is neutral, <M>Open</M> is indigo, and green is reserved
            for <M>Solved</M>.
          </span>
          <GroupHead title="Special surfaces" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(228px,1fr))] gap-3.5">
            {SPECIAL_SURFACES.map((s) => (
              <div key={s.value} className="flex flex-col gap-2">
                <div
                  className={cn(
                    "flex h-13 items-center rounded-md px-3 text-xs font-semibold",
                    s.surface,
                  )}
                >
                  {s.label}
                </div>
                <span className="font-mono text-xs text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </DocSection>
  );
}

/* ----------------------------------------------------------- 2. SHADCN TOKENS */

function SectionShadcnTokens() {
  return (
    <DocSection
      id="shadcn"
      eyebrow="Foundations"
      title="shadcn token contract"
      description={
        <>
          The full shadcn variable set mapped to ServiceDesk values. These go in{" "}
          <M>app/globals.css</M> under <M>:root</M> and <M>.dark</M>; every primitive reads them, so
          a re-skin is one file.
        </>
      }
    >
      <RefTable
        head={["Token", "ServiceDesk value", "Used by"]}
        cols={["w-60", "w-41", ""]}
        rows={SHADCN_ROWS}
        keyOf={(r) => r.token}
        render={(r) => [
          <span key={0} className="font-mono text-xs font-semibold text-primary">
            {r.token}
          </span>,
          <span key={1} className="font-mono text-xs text-muted-foreground">
            {r.value}
          </span>,
          <span
            key={2}
            className="text-xs leading-normal whitespace-normal text-secondary-foreground"
          >
            {r.use}
          </span>,
        ]}
      />
      <DocCode code={CODE.tokens} />
    </DocSection>
  );
}

/* -------------------------------------------------------------- 3. TYPOGRAPHY */

function SectionTypography() {
  return (
    <DocSection
      id="type"
      eyebrow="Foundations"
      title="Typography"
      description={
        <>
          Inter for everything readable, JetBrains Mono for anything a user might copy — ticket IDs,
          amounts, IPs, DNS records, API keys. Headings carry <M>-0.02em</M> tracking; body sits at
          1.6 line-height. Sentence case throughout.
        </>
      }
    >
      {/* D6 — typography specimen table. Left cell renders live type at real size. */}
      <Card className={cn(PANEL_FLUSH)}>
        {TYPE_ROWS.map((r) => (
          <div
            key={r.role}
            className="grid grid-cols-1 items-baseline gap-4 border-b border-muted p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_208px_128px]"
          >
            <span className={r.cls}>{r.sample}</span>
            <span className="font-mono text-xs text-muted-foreground">{r.spec}</span>
            <span className="text-xs text-slate-400">{r.role}</span>
          </div>
        ))}
      </Card>
      <DocCode code={CODE.type} />
    </DocSection>
  );
}

/* --------------------------------------------------------- 4. SPACING + RADIUS */

function SectionSpaceRadius() {
  return (
    <DocSection
      id="space"
      eyebrow="Foundations"
      title="Spacing & radius"
      description={
        <>
          A 4px grid, expressed as flex/grid <M>gap</M> rather than margins. Radius climbs with the
          size of the surface: controls 6–8px, buttons 10px, panels 14px, feature cards 16px.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-3.5 px-5")}>
          <GroupHead title="Spacing scale" />
          <div className="flex flex-col gap-2">
            {SPACE_SCALE.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                {/* D5 — the specimen demonstrates the utility by using it. */}
                <span className={cn("h-4 rounded-xs bg-primary", s.w)} />
                <span className="w-24 font-mono text-xs text-secondary-foreground">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.use}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-3.5 px-5")}>
          <GroupHead title="Radius scale" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {RADIUS_SCALE.map((r) => (
              <div key={r.label} className="flex flex-col items-start gap-1.5">
                <span
                  className={cn("h-10 w-13 border border-accent-foreground bg-accent", r.cls)}
                />
                <span className="font-mono text-xs text-secondary-foreground">{r.label}</span>
                <span className="text-xs text-slate-400">{r.use}</span>
              </div>
            ))}
            <div className="flex flex-col items-start gap-1.5">
              <span className="size-10 rounded-full border border-accent-foreground bg-accent" />
              <span className="font-mono text-xs text-secondary-foreground">· on a square</span>
              <span className="text-xs text-slate-400">avatar, dot</span>
            </div>
          </div>
        </Card>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------- 5. ELEVATION + MOTION */

function SectionElevationMotion() {
  return (
    <DocSection
      id="elevation"
      eyebrow="Foundations"
      title="Elevation & motion"
      description={
        <>
          Shadows are Tailwind&rsquo;s four primitives — <M>shadow-xs</M>, <M>sm</M>, <M>lg</M>,{" "}
          <M>xl</M> — assigned by role rather than hand-tuned by depth. Motion is short and
          functional: <M>duration-200 ease-out</M> for colour, Radix&rsquo;s own transition for the
          mobile sheet, and a deliberate 550ms loading flash on navigation so skeletons are visible
          rather than flickering.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-4 px-5")}>
          <GroupHead title="Elevation" />
          <div className="flex flex-col gap-4">
            {ELEVATION_ROWS.map((e) => (
              <div key={e.label} className="flex items-center gap-3.5">
                <span className={cn("h-11 w-18 flex-none rounded-lg", e.cls)} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold">{e.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{e.value}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={cn(PANEL, "gap-4 px-5")}>
          <GroupHead title="Motion" />
          <div className="flex flex-col gap-3">
            {MOTION_ROWS.map((m) => (
              <div key={m.key} className="grid grid-cols-[96px_minmax(0,1fr)] items-baseline gap-3">
                <span className="font-mono text-xs text-primary">{m.key}</span>
                <span className="text-xs leading-[1.55] text-secondary-foreground">{m.body}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-muted pt-3.5">
            <span className="text-xs font-bold">Hover / press model</span>
            <span className="text-xs leading-[1.6] text-muted-foreground">
              Actions lighten toward <M>bg-primary/90</M> and darken to <M>bg-primary/80</M>. Cards
              raise one elevation step and shift up 1px. Rows tint to brand-soft.
            </span>
          </div>
        </Card>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------- 6. BREAKPOINTS */

function SectionBreakpoints() {
  return (
    <DocSection
      id="layout"
      eyebrow="Foundations"
      title="Breakpoints & layout"
      description={
        <>
          Tailwind&rsquo;s default breakpoints, unchanged — <M>sm</M> through <M>2xl</M> keep their
          stock widths. One step is <em>added</em> for ultra-wide, <M>wide: 1800px</M>, because the
          sidebar and page padding change there and no default sits at that width. Each carries a
          behavioural rule, not a size tweak; touch targets are 44px below <M>sm</M> and 36px above{" "}
          <M>md</M>.
        </>
      }
    >
      <RefTable
        head={["Tailwind", "Width", "Behaviour"]}
        cols={["w-34", "w-31", ""]}
        rows={BREAKPOINT_ROWS}
        keyOf={(b) => b.name}
        render={(b) => [
          <span key={0} className="font-mono text-xs font-semibold text-primary">
            {b.name}
          </span>,
          <span key={1} className="font-mono text-xs text-muted-foreground">
            {b.width}
          </span>,
          <span
            key={2}
            className="text-xs leading-normal whitespace-normal text-secondary-foreground"
          >
            {b.behaviour}
          </span>,
        ]}
      />
    </DocSection>
  );
}

/* ----------------------------------------------------------------- 7. BUTTONS */

function SectionButtons() {
  return (
    <DocSection
      id="buttons"
      eyebrow="Components"
      title="Buttons"
      description="One primary action per view. Secondary for the alternative, ghost for tertiary and toolbar actions, danger only for irreversible ones — and always behind a confirm. Labels are verb-first and sentence case."
    >
      <Card className={cn(PANEL, "gap-5 px-5")}>
        <div className="flex flex-col gap-3">
          <Eyebrow>Variants</Eyebrow>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary" size="touch">
              New ticket
            </Button>
            <Button variant="neutral" size="touch">
              Import from CSV
            </Button>
            <Button variant="quiet" size="touch">
              Cancel
            </Button>
            <Button variant="danger" size="touch">
              Delete workspace
            </Button>
          </div>
          <Caption>
            <M>primary</M> · <M>secondary</M> · <M>ghost</M> · <M>danger</M> → shadcn{" "}
            <M>default / secondary / ghost / destructive</M>
          </Caption>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-4">
          <Eyebrow>Sizes</Eyebrow>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary" size="touch-sm">
              Small · sm
            </Button>
            <Button variant="primary" size="touch">
              Medium · md
            </Button>
            <Button variant="primary" size="touch-lg">
              Large · lg
            </Button>
          </div>
          <Caption>
            Row and toolbar actions use <M>sm</M>; forms use <M>md</M>; auth and full-width CTAs use{" "}
            <M>lg</M>. In the React port these are <M>h-11 md:h-8</M> / <M>h-11 md:h-10</M> /{" "}
            <M>h-12</M> — every button floors at 44px below <M>md:</M>.
          </Caption>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-4">
          <Eyebrow>States</Eyebrow>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary" size="touch">
              Default
            </Button>
            <Button variant="primary" size="touch" loading>
              Signing in
            </Button>
            <Button variant="primary" size="touch" disabled>
              Disabled
            </Button>
            <Button variant="neutral" size="touch" disabled>
              Disabled secondary
            </Button>
            {/* IconButton — row 41: ghost + required label becomes aria-label and tooltip. */}
            <IconButton label="Filter">
              <FilterGlyph />
            </IconButton>
          </div>
          <Caption>
            Loading keeps the label and swaps in a spinner — the button never collapses or changes
            width. Disabled fills <M>slate-200</M> with no pointer events; in the React port it is{" "}
            <M>disabled:opacity-50</M>.
          </Caption>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-4">
          <Eyebrow>Toolbar ghost — the queue filter bar variant</Eyebrow>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3">
            <Button variant="neutral" size="touch-sm" className="h-9 rounded-md font-semibold">
              Priority
            </Button>
            <Button variant="neutral" size="touch-sm" className="h-9 rounded-md font-semibold">
              Status
            </Button>
            <Button
              variant="neutral"
              size="touch-sm"
              className="h-9 rounded-md border-accent-foreground bg-accent font-semibold text-accent-foreground"
            >
              Columns · 3
            </Button>
            <Button
              variant="quiet"
              size="touch-sm"
              className="h-9 rounded-md font-semibold text-muted-foreground"
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>
      <DocCode code={CODE.buttons} />
    </DocSection>
  );
}

/** Row 41 — COMPOSE: ghost Button + Tooltip, with `label` required by the type. */
function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Button variant="quiet" size="touch-icon" aria-label={label} title={label}>
      {children}
    </Button>
  );
}

function FilterGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4.5"
      aria-hidden="true"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ 8. BADGES */

const TONES = ["neutral", "brand", "info", "success", "warning", "error"] as const;

function SectionBadges() {
  return (
    <DocSection
      id="badges"
      eyebrow="Components"
      title="Badges & tags"
      description={
        <>
          Badges are read-only status. A leading dot is added when the badge answers{" "}
          <em>what state is this in</em> (status, SLA, health) and omitted when it answers{" "}
          <em>what kind is this</em> (priority, plan, category). Tags are interactive — filters and
          ticket labels.
        </>
      }
    >
      <Card className={cn(PANEL, "gap-5 px-5")}>
        <div className="flex flex-col gap-3">
          <Eyebrow>Tones</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <Badge key={t} tone={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <Badge key={t} tone={t} dot>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3.5 border-t border-muted pt-4">
          <Eyebrow>Semantic mapping</Eyebrow>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold">Priority — no dot</span>
              <div className="flex flex-wrap gap-1.5">
                {(["Urgent", "High", "Normal", "Low"] as const).map((p) => (
                  <Badge key={p} tone={priorityTone[p] ?? "neutral"}>
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold">Status — dot</span>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={statusTone["New"] ?? "neutral"} dot>
                  New
                </Badge>
                <Badge tone="info" dot>
                  Awaiting triage
                </Badge>
                <Badge tone={statusTone["Pending"] ?? "neutral"} dot>
                  Pending
                </Badge>
                <Badge tone={statusTone["Solved"] ?? "neutral"} dot>
                  Solved
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold">SLA — dot, live copy</span>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="success" dot>
                  4h 20m left
                </Badge>
                <Badge tone="warning" dot>
                  1h 12m left
                </Badge>
                <Badge tone="error" dot>
                  Breached 26m
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-muted pt-4">
          <Eyebrow>Tags & counts</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            {/* Row 44 — Tag is the interactive form of the same recipe. */}
            <Badge tone="neutral" size="tag" interactive className="bg-card">
              billing
            </Badge>
            <Badge tone="neutral" size="tag" interactive className="bg-card">
              auth
            </Badge>
            <Badge tone="brand" size="tag" interactive>
              sso
            </Badge>
            <Badge tone="neutral" size="tag" interactive removable className="bg-card">
              enterprise
              <span aria-hidden="true" className="text-slate-400">
                ×
              </span>
            </Badge>
            {/* Row 45 — count pills. */}
            <Badge tone="brand" size="count">
              12
            </Badge>
            <Badge size="count-sm" className="bg-destructive text-primary-foreground ring-0">
              3
            </Badge>
            <Caption>Count pill in nav · unread bell badge</Caption>
          </div>
        </div>
      </Card>
      <DocCode code={CODE.badges} />
    </DocSection>
  );
}

export function Part01() {
  return (
    <>
      <SectionColor />
      <SectionShadcnTokens />
      <SectionTypography />
      <SectionSpaceRadius />
      <SectionElevationMotion />
      <SectionBreakpoints />
      <SectionButtons />
      <SectionBadges />
    </>
  );
}
