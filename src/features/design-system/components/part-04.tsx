import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  A11Y_ROWS,
  API_ROWS,
  CODE2,
  CUSTOM_ROWS,
  DUP_ROWS,
  FMT_ROWS,
  ROLE_ROWS,
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
import { cn } from "@/lib/utils";

/* Sections 22–28: Layout & app shell · Roles & gating · Content & formatting ·
   Accessibility · Do & don't · Component API · Custom variables · Next.js setup. */

/* ------------------------------------------------------- 22. LAYOUT & SHELL */

function SectionShell() {
  return (
    <DocSection
      id="shell"
      eyebrow="Patterns"
      title="Layout & app shell"
      description="Every agent screen is the same three bands: sidebar, top bar, content. Content opens with a page header and stacks 20px-gapped sections. Settings screens add a description column so the form never spans the full width."
    >
      <Card className={cn(PANEL, "gap-4 px-5")}>
        <div className="flex flex-col gap-2.5">
          <Eyebrow>Page header — one per screen</Eyebrow>
          {/* Row 97 — COMPOSE: heading utilities + Button. Title 24/700/tracking-tight. */}
          <div className="flex flex-wrap items-start gap-3.5 border-b border-muted pb-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="text-2xl font-bold tracking-tight">Ticket queue</h3>
              <span className="text-sm text-muted-foreground">
                38 open · 3 breaching in the next hour
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="neutral" size="touch">
                Import
              </Button>
              <Button variant="primary" size="touch">
                New ticket
              </Button>
            </div>
          </div>
          <Caption>
            Title 22px, subtitle carries live counts rather than a static description, actions
            right-aligned with the primary last. Below <M>sm:</M> the actions wrap full-width
            beneath the title.
          </Caption>
        </div>

        <div className="flex flex-col gap-2.5">
          <Eyebrow>Settings — description column</Eyebrow>
          {/* Row 98 — 240px description column, 24px gutter; stacks below md:. */}
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-background p-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">Two-factor</span>
              <span className="text-xs leading-[1.6] text-pretty text-muted-foreground">
                Explain the setting and its blast radius here, so the control itself needs no helper
                text.
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <span className="flex-1 text-sm text-secondary-foreground">
                Require for every agent
              </span>
              {/* Switch (row 51) is DEFERRED — `ui/switch.tsx` is not installed and the
                  shadcn registry is unreachable from this environment. Not hand-authored. */}
            </div>
          </div>
          <Caption>
            240px description column, 24px gutter. Collapses to a single stacked column below{" "}
            <M>md:</M>, description first.
          </Caption>
        </div>

        <div className="flex flex-col gap-2.5">
          <Eyebrow>Sticky save bar — long forms only</Eyebrow>
          {/* Row 99 — COMPOSE: Card + Button. Shadows UPWARD. */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-[0_-10px_15px_-3px_rgb(0_0_0_/_0.1)]">
            <span className="text-xs text-muted-foreground">3 unsaved changes</span>
            <span className="ml-auto flex gap-2">
              <Button variant="quiet" size="touch">
                Discard
              </Button>
              <Button variant="primary" size="touch">
                Save changes
              </Button>
            </span>
          </div>
          <Caption>
            Appears only once a field is dirty, counts the changes, and shadows upward. Switches
            inside instant-apply cards never trigger it.
          </Caption>
        </div>

        <div className="flex flex-col gap-2 border-t border-muted pt-4">
          <Eyebrow>Measurements</Eyebrow>
          <span className="font-mono text-xs leading-[1.9] text-secondary-foreground">
            sidebar&nbsp; w-64 256 expanded · w-18 72 rail · w-72 288 at wide:
            <br />
            top bar&nbsp; h-14 56, sticky, hairline base
            <br />
            page pad&nbsp; p-4 16 → p-6 24 → p-8 32 / p-12 48
            <br />
            content&nbsp; max-w-[2040px], centred
            <br />
            section gap&nbsp; gap-5 20 · card gap gap-4 16
          </span>
        </div>
      </Card>
    </DocSection>
  );
}

/* ----------------------------------------------------------- 23. ROLES & GATING */

function SectionRoles() {
  return (
    <DocSection
      id="roles"
      eyebrow="Patterns"
      title="Roles & gating"
      description={
        <>
          Four roles decide what renders. The rule is{" "}
          <span className="font-semibold text-foreground">hide, don&rsquo;t disable</span> — a nav
          item a role can never use is absent, not greyed. Disabled is reserved for something the
          same user could enable.
        </>
      }
    >
      <RefTable
        head={["Role", "Sees", "Never sees"]}
        cols={["w-41", "", ""]}
        rows={ROLE_ROWS}
        align="top"
        keyOf={(r) => r.role}
        render={(r) => [
          <span key={0} className="text-xs font-bold">
            {r.role}
          </span>,
          <span
            key={1}
            className="text-xs leading-[1.55] whitespace-normal text-secondary-foreground"
          >
            {r.sees}
          </span>,
          <span key={2} className="text-xs leading-[1.55] whitespace-normal text-muted-foreground">
            {r.denied}
          </span>,
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {[
          {
            t: "Coming soon ≠ denied",
            b: (
              <>
                An unbuilt feature shows a muted row with a <M>Soon</M> label and is not clickable.
                A denied feature isn&rsquo;t in the DOM.
              </>
            ),
          },
          {
            t: "Role notice, not a 403",
            b: "Landing somewhere a role can't reach redirects to that role's home and shows the indigo info alert — never an error page.",
          },
          {
            t: "Billing wall overrides all",
            b: "A suspended workspace hides every surface including nav, for every role. Only Tenant Admin sees a recovery action; others see who to contact.",
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

/* ------------------------------------------------- 24. CONTENT & FORMATTING */

function SectionContent() {
  return (
    <DocSection
      id="content"
      eyebrow="Guidance"
      title="Content & formatting"
      description="Interloid's voice, applied to a tool people use under time pressure: outcome first, sentence case, no jargon, no emoji. An agent scanning at speed should never have to read a sentence twice."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-4 px-5")}>
          <GroupHead title="Three formulas" />
          {[
            {
              t: "Error",
              b: "What happened · why · what to do. “That email and password don't match. Check both, or reset your password.”",
            },
            {
              t: "Empty state",
              b: "State · reason · one action. “Queue clear. Nothing matches this view.” + New ticket.",
            },
            {
              t: "Destructive confirm",
              b: "Question · consequence in numbers · the verb repeated on the button.",
            },
          ].map((f) => (
            <div key={f.t} className="flex flex-col gap-1">
              <span className="text-xs font-bold">{f.t}</span>
              <span className="text-xs leading-[1.6] text-muted-foreground">{f.b}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1.5 border-t border-muted pt-3.5">
            <span className="text-xs font-bold">Word choices we fix</span>
            <span className="text-xs leading-[1.75] text-muted-foreground">
              “Solve”, not close · “Requester”, not reporter · “Agent”, not user · “Breached”, not
              violated · “Workspace”, not tenant (tenant is internal) · “Save changes”, not Submit ·
              “Something went wrong” is banned — name the thing.
            </span>
          </div>
        </Card>

        <Card className={cn(PANEL_FLUSH)}>
          <div className="bg-background px-4 py-3.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Formatting
          </div>
          {FMT_ROWS.map((f) => (
            <div
              key={f.what}
              className="grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-3 border-t border-muted px-4 py-2.5"
            >
              <span className="text-xs font-semibold">{f.what}</span>
              <span className="text-xs leading-[1.55] text-secondary-foreground">{f.rule}</span>
            </div>
          ))}
        </Card>
      </div>
    </DocSection>
  );
}

/* ------------------------------------------------------------ 25. ACCESSIBILITY */

function SectionA11y() {
  return (
    <DocSection
      id="a11y"
      eyebrow="Guidance"
      title="Accessibility"
      description="Target is WCAG AA for everything that carries meaning. Ratios below are computed from the shipped hexes using WCAG 2.1 relative luminance — recheck them whenever a token moves. Two pairs fail on purpose and are restricted to decoration, listed so nobody promotes them to body text by accident."
    >
      <RefTable
        head={["Pair", "Values", "Ratio", "Verdict"]}
        cols={["", "w-50", "w-23", "w-58"]}
        rows={A11Y_ROWS}
        keyOf={(a) => a.pair}
        render={(a) => [
          <span key={0} className="text-xs text-secondary-foreground">
            {a.pair}
          </span>,
          <span key={1} className="font-mono text-xs text-muted-foreground">
            {a.val}
          </span>,
          <span key={2} className="font-mono text-xs font-semibold">
            {a.ratio}
          </span>,
          <span key={3} className="text-xs whitespace-normal text-secondary-foreground">
            {a.verdict}
          </span>,
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5">
        {[
          {
            t: "Never colour alone",
            b: "Every status pill pairs its tone with text, and SLA pills add a dot. A colour-blind agent reads “Breached 26m”, not red.",
          },
          {
            t: "Live regions",
            b: (
              <>
                SLA countdowns are <M>aria-live=&quot;off&quot;</M> — they&rsquo;d interrupt
                constantly. Toasts are <M>polite</M>; breach alerts are <M>assertive</M>.
              </>
            ),
          },
          {
            t: "Icon-only controls",
            b: (
              <>
                IconButton requires <M>label</M>; it becomes both the tooltip and the aria-label. A
                rail icon with no label is a bug.
              </>
            ),
          },
          {
            t: "Reduced motion",
            b: (
              <>
                Under <M>prefers-reduced-motion</M> the skeleton pulse and sheet slide resolve
                instantly; nothing conveys state through motion alone.
              </>
            ),
          },
          {
            t: "Focus & targets",
            b: (
              <>
                The focus indicator is two parts: a 1–2px <M>border-ring</M> solid, which carries
                the 3:1 non-text contrast SC 1.4.11 asks for (3.3:1 on white), plus a 3px{" "}
                <M>ring-ring/30</M> halo as a secondary cue at 1.4:1. Never remove either — restyle
                only. 44px targets below <M>sm:</M>, 36px minimum above <M>md:</M>. Overlays trap
                focus and restore it to the trigger.
              </>
            ),
          },
          {
            t: "Tables",
            b: (
              <>
                Real <M>th</M> with <M>scope</M> and <M>aria-sort</M> on the active column, even
                though layout is CSS grid.
              </>
            ),
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

/* -------------------------------------------------------------- 26. DO / DON'T */

/**
 * D9 — Do / Don't panel. `ui/alert.tsx` is FORBIDDEN here: it hardcodes `role="alert"`
 * (alert.tsx:30), which would make all four pairs assertive live regions read out on load.
 * The surface/border pairs are reused from treatments §3.4 as a treatment, so no new
 * colour enters — same token pairs the Alert tones use.
 */
const DO_PANEL = "rounded-md border border-success/25 bg-success-soft p-3";
const DONT_PANEL = "rounded-md border border-destructive/25 bg-destructive-soft p-3";
const DO_LABEL = "w-full text-xs font-bold tracking-wider text-primary uppercase";
const DONT_LABEL = "w-full text-xs font-bold tracking-wider text-destructive-strong uppercase";

function SectionDoDont() {
  return (
    <DocSection
      id="dodont"
      eyebrow="Guidance"
      title="Do & don't"
      description="The four mistakes that actually came up while building the 43 screens."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(292px,1fr))] gap-4">
        <Card className={cn(PANEL, "gap-2.5 px-4 [--card-spacing:--spacing(4)]")}>
          <span className="text-xs font-bold">Primary actions</span>
          <div className={cn(DO_PANEL, "flex flex-wrap items-center gap-2.5")}>
            <span className={DO_LABEL}>Do</span>
            <Button variant="primary" size="touch-sm">
              New ticket
            </Button>
            <Button variant="neutral" size="touch-sm">
              Import
            </Button>
            <Button variant="quiet" size="touch-sm">
              Cancel
            </Button>
          </div>
          <div className={cn(DONT_PANEL, "flex flex-wrap items-center gap-2.5")}>
            <span className={DONT_LABEL}>Don&rsquo;t</span>
            <Button variant="primary" size="touch-sm">
              New ticket
            </Button>
            <Button variant="primary" size="touch-sm">
              Import
            </Button>
            <Button variant="primary" size="touch-sm">
              Export
            </Button>
          </div>
          <Caption>Three filled buttons give an agent no idea which one the screen is for.</Caption>
        </Card>

        <Card className={cn(PANEL, "gap-2.5 px-4 [--card-spacing:--spacing(4)]")}>
          <span className="text-xs font-bold">Status pills</span>
          <div className={cn(DO_PANEL, "flex flex-wrap items-center gap-2")}>
            <span className={DO_LABEL}>Do</span>
            <Badge tone="error" dot>
              Breached 26m
            </Badge>
            <Badge tone="success" dot>
              4h 20m left
            </Badge>
          </div>
          <div className={cn(DONT_PANEL, "flex flex-wrap items-center gap-2")}>
            <span className={DONT_LABEL}>Don&rsquo;t</span>
            <span className="inline-block size-2 rounded-full bg-destructive" />
            <span className="inline-block size-2 rounded-full bg-ring" />
            <span className="text-xs text-destructive-strong">colour with no text</span>
          </div>
          <Caption>
            A bare dot is unreadable to a colour-blind agent and meaningless on a screenshot.
          </Caption>
        </Card>

        <Card className={cn(PANEL, "gap-2.5 px-4 [--card-spacing:--spacing(4)]")}>
          <span className="text-xs font-bold">Denied features</span>
          <div className={cn(DO_PANEL, "flex flex-col gap-1")}>
            <span className={DO_LABEL}>Do — absent</span>
            <NavRow>Tickets</NavRow>
            <NavRow>Customers</NavRow>
          </div>
          <div className={cn(DONT_PANEL, "flex flex-col gap-1")}>
            <span className={DONT_LABEL}>Don&rsquo;t — greyed</span>
            <NavRow>Tickets</NavRow>
            <NavRow greyed>Billing 🔒</NavRow>
          </div>
          <Caption>
            A permanently disabled row advertises a feature the agent can never reach — and the lock
            glyph is an emoji.
          </Caption>
        </Card>

        <Card className={cn(PANEL, "gap-2.5 px-4 [--card-spacing:--spacing(4)]")}>
          <span className="text-xs font-bold">Loading</span>
          <div className={cn(DO_PANEL, "flex flex-col gap-1.5")}>
            <span className={DO_LABEL}>Do — mirror the layout</span>
            <span className="flex h-8 items-center gap-2.5 rounded-sm bg-card px-2.5">
              <Skeleton className="h-2 w-10 rounded-sm bg-border" />
              <Skeleton className="h-2 flex-1 rounded-sm bg-border" />
              <Skeleton className="h-4 w-13 rounded-full bg-border" />
            </span>
          </div>
          <div className={cn(DONT_PANEL, "flex flex-col gap-1.5")}>
            <span className={DONT_LABEL}>Don&rsquo;t — centred spinner</span>
            <span className="flex h-8 items-center justify-center rounded-sm bg-card">
              <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            </span>
          </div>
          <Caption>
            A spinner where a list will appear guarantees a layout shift when data lands.
          </Caption>
        </Card>
      </div>
    </DocSection>
  );
}

function NavRow({ children, greyed }: { children: React.ReactNode; greyed?: boolean }) {
  return (
    <span
      className={cn(
        "flex min-h-8 items-center rounded-sm border border-border px-2.5 text-sm",
        greyed ? "bg-background text-slate-400" : "bg-card text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- 27. COMPONENT API */

function SectionApi() {
  return (
    <DocSection
      id="api"
      eyebrow="Guidance"
      title="Component API"
      description="What exists, so nobody re-invents a variant. Anything not on this list should be composed from these parts rather than added to them."
    >
      <RefTable
        head={["Component", "Props", "Notes"]}
        cols={["w-36", "", "w-69"]}
        rows={API_ROWS}
        align="top"
        keyOf={(x) => x.c}
        render={(x) => [
          <span key={0} className="text-xs font-bold">
            {x.c}
          </span>,
          <span
            key={1}
            className="font-mono text-xs leading-[1.6] whitespace-normal text-secondary-foreground"
          >
            {x.p}
          </span>,
          <span key={2} className="text-xs leading-[1.55] whitespace-normal text-muted-foreground">
            {x.n}
          </span>,
        ]}
      />
    </DocSection>
  );
}

/* ------------------------------------------------------- 28. CUSTOM VARIABLES */

function SectionCustom() {
  return (
    <DocSection
      id="custom"
      eyebrow="Guidance"
      title="Custom variables"
      description={
        <>
          Nothing shadcn or Tailwind predefines is redefined anywhere in this system. Every colour
          resolves to a stock Tailwind primitive — with two deliberate exceptions — the{" "}
          <M>--success</M> triple and the selected-state pair <M>--brand-soft</M>/<M>--accent</M>{" "}
          (#E7F1F1) — which carry the reference design&rsquo;s exact values verbatim. Every radius
          comes from shadcn&rsquo;s <M>--radius</M> ladder, every size is a named Tailwind step, and
          every spacing value is a multiple of the 4px base. Two kinds of addition, 41 names in
          total. The seven <em>semantic</em> groups below exist because shadcn has no token for the
          job. The eighth is the <em>bundle bridge</em> — 33 names the Interloid component library
          reads (<M>--blue-base</M>, <M>--neutral-*</M>, <M>--space-*</M>, <M>--radius-*</M>,{" "}
          <M>--shadow-*</M>), each pointed at the contract above so its components render in this
          system. Nothing predefined by Tailwind or shadcn is redefined by either group.
        </>
      }
    >
      <RefTable
        head={["Added variable", "Resolves to", "Why it exists"]}
        cols={["w-67", "w-50", ""]}
        rows={CUSTOM_ROWS}
        align="top"
        keyOf={(c) => c.v}
        render={(c) => [
          <span key={0} className="font-mono text-xs font-semibold whitespace-normal text-primary">
            {c.v}
          </span>,
          <span key={1} className="font-mono text-xs whitespace-normal text-muted-foreground">
            {c.tw}
          </span>,
          <span
            key={2}
            className="text-xs leading-[1.55] whitespace-normal text-secondary-foreground"
          >
            {c.why}
          </span>,
        ]}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 pt-2">
          <GroupHead title="Duplicate audit" />
          <p className="max-w-[74ch] text-xs leading-[1.6] text-pretty text-muted-foreground">
            Every pair that resolves to the same or an adjacent primitive, checked. Three are the
            same value on purpose, one was a real collision and is fixed, the rest are distinct.
          </p>
        </div>
        <RefTable
          head={["Pair", "Values", "Verdict", "Reasoning"]}
          cols={["w-67", "w-50", "w-27", ""]}
          rows={DUP_ROWS}
          align="top"
          keyOf={(d) => d.a}
          render={(d) => [
            <span
              key={0}
              className="font-mono text-xs font-semibold whitespace-normal text-primary"
            >
              {d.a}
            </span>,
            <span key={1} className="font-mono text-xs whitespace-normal text-muted-foreground">
              {d.v}
            </span>,
            <span key={2} className="text-xs font-bold text-secondary-foreground">
              {d.verdict}
            </span>,
            <span
              key={3}
              className="text-xs leading-[1.55] whitespace-normal text-secondary-foreground"
            >
              {d.note}
            </span>,
          ]}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {[
          {
            t: "One added breakpoint",
            b: (
              <>
                <M>--breakpoint-wide: 1800px</M>. Tailwind&rsquo;s <M>sm…2xl</M> keep their stock
                widths; nothing is remapped.
              </>
            ),
          },
          {
            t: "No radius overrides",
            b: (
              <>
                Only <M>--radius: 0.625rem</M> carries a value. <M>rounded-sm/md/lg/xl</M> derive
                from it exactly as shadcn intends, and the bridge&rsquo;s <M>--radius-*</M> are{" "}
                <M>calc()</M> off the same base, so changing it moves every step together.{" "}
                <M>rounded-2xl</M> and <M>rounded-full</M> stay Tailwind&rsquo;s.
              </>
            ),
          },
          {
            t: "No type-scale overrides",
            b: (
              <>
                Sizes are <M>text-xs</M> → <M>text-4xl</M> only. The old 10.5 / 11.5 / 12.5 / 13.5 /
                17 / 21 / 22px steps are gone — <M>text-xs</M> (12px) is the floor, which also
                clears the caption-contrast risk.
              </>
            ),
          },
          {
            t: "Shadows are Tailwind's",
            b: (
              <>
                <M>shadow-xs</M> at rest, <M>shadow-sm</M> on controls, <M>shadow-lg</M> on
                overlays, <M>shadow-xl</M> on dialogs and sheets. The slate-tinted custom set is
                retired.
              </>
            ),
          },
          {
            t: "Focus is shadcn's",
            b: (
              <>
                React side is <M>focus-visible:ring-[3px] ring-ring/30</M> plus <M>border-ring</M>.
                The bridge also defines <M>--ring-focus</M> at the same 3px / 30% for the
                bundle&rsquo;s components, which read that name.
              </>
            ),
          },
          {
            t: "Arbitrary values, sparingly",
            b: (
              <>
                Four, all measurements rather than tokens: the content caps <M>max-w-[2040px]</M>{" "}
                (app shell) and <M>max-w-[980px]</M> / <M>[1240px]</M> (portal), and{" "}
                <M>text-[10px]</M> on the unread-count badge, where the 12px floor doesn&rsquo;t fit
                a 16px circle. Everything else that was arbitrary is now a named step —{" "}
                <M>size-4.5</M> for Lucide&rsquo;s 18px icons, <M>rounded-lg</M>, <M>max-w-2xl</M>,{" "}
                <M>tracking-tight</M>.
              </>
            ),
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

/* ------------------------------------------------------------- 29. NEXT.JS */

function SectionNextjs() {
  return (
    <DocSection
      id="nextjs"
      eyebrow="Handoff"
      title="Next.js setup"
      description={
        <>
          The export in <M>react/</M> is a drop-in App Router project: Tailwind v4 tokens in{" "}
          <M>globals.css</M>, a v3 fallback config, and four shadcn primitives retuned to this
          system. Everything else is stock shadcn and inherits the tokens.
        </>
      }
    >
      <Card className={cn(PANEL, "gap-4 px-5")}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {[
            {
              t: "Token layer",
              lines: [
                "app/globals.css",
                "tailwind.config.ts",
                "postcss.config.mjs",
                "components.json",
                "lib/tokens.ts",
              ],
            },
            {
              t: "Retuned primitives",
              lines: [
                "components/ui/button.tsx",
                "components/ui/badge.tsx",
                "components/ui/card.tsx",
                "components/ui/input.tsx",
              ],
            },
            {
              t: "Shared helpers",
              lines: [
                "lib/badge-tones.ts",
                "lib/utils.ts",
                "components/page-header.tsx",
                "components/state-card.tsx",
              ],
            },
          ].map((g) => (
            <div key={g.t} className="flex flex-col gap-2">
              <span className="text-xs font-bold">{g.t}</span>
              <span className="font-mono text-xs leading-[1.8] text-secondary-foreground">
                {g.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <DocCode code={CODE2.install} />

      <Card className={cn(PANEL, "gap-2.5 px-5")}>
        <span className="text-xs font-bold">Adherence rules</span>
        <span className="text-sm leading-[1.75] text-secondary-foreground">
          1. No new hex codes in components — extend <M>globals.css</M>.
          <br />
          2. Status colour always comes from <M>lib/badge-tones.ts</M>, never a literal Tailwind
          palette.
          <br />
          3. Neutrals are slate-tinted; <M>gray-*</M> and <M>zinc-*</M> are off-limits.
          <br />
          4. Sibling groups lay out with flex/grid <M>gap</M>, not margins.
          <br />
          5. One primary button per view; destructive actions always confirm.
          <br />
          6. Every list screen implements all four states before it ships.
        </span>
      </Card>
    </DocSection>
  );
}

export function Part04() {
  return (
    <>
      <SectionShell />
      <SectionRoles />
      <SectionContent />
      <SectionA11y />
      <SectionDoDont />
      <SectionApi />
      <SectionCustom />
      <SectionNextjs />
    </>
  );
}
