"use client";

import {
  BREAKPOINTS,
  COLOR_GROUPS,
  RADIUS_STEPS,
  SHADOW_LADDER,
  SHADOW_ROLES,
  SPACE_STEPS,
  TYPE_STEPS,
  compare,
  formatScore,
  liveCheckIds,
  runChecks,
  scoreByCategory,
  type Verdict,
} from "@/features/token-audit/tokens";
import {
  exceptionFor,
  staleExceptions,
  unsignedExceptions,
} from "@/features/token-audit/exceptions";
import type { Measured } from "@/features/token-audit/use-measured";

/* ------------------------------------------------------------------ chrome */

function Chip({ verdict, exceptionId }: { verdict: Verdict; exceptionId?: string }) {
  const map: Record<Verdict, { text: string; cls: string }> = {
    match: { text: "exact", cls: "bg-success-soft text-success-strong ring-success/25" },
    accepted: {
      text: exceptionId ? `accepted · ${exceptionId}` : "accepted",
      cls: "bg-note text-note-foreground ring-note-border",
    },
    differs: {
      text: "differs",
      cls: "bg-destructive-soft text-destructive-strong ring-destructive/25",
    },
    unscored: { text: "unscored", cls: "bg-secondary text-secondary-foreground ring-border" },
  };
  const { text, cls } = map[verdict];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {text}
    </span>
  );
}

function Panel({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section {...(id ? { id } : {})} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {note ? <p className="max-w-[74ch] text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {children}
      </div>
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs break-all text-muted-foreground">{children}</span>;
}

/* ------------------------------------------------------------------- colour */

function ColorRows({ measured }: { measured: Measured }) {
  return (
    <>
      {COLOR_GROUPS.map((group) => (
        <Panel key={group.id} id={`tok-${group.id}`} title={group.title} note={group.note}>
          <div className="grid grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_76px] gap-3 bg-background px-4 py-2.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            <span>Swatch</span>
            <span>Token</span>
            <span>Design declares</span>
            <span>App resolves</span>
            <span>Verdict</span>
          </div>
          {group.tokens.map((t) => {
            const key = t.varName ?? `lit:${t.literal}`;
            const paint = t.varName ? `var(${t.varName})` : (t.literal ?? "transparent");
            const actual = measured[key];
            const raw = measured[`${key}.raw`];
            return (
              <div
                key={key}
                className="grid grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_76px] items-center gap-3 border-t border-muted px-4 py-2.5"
              >
                <span
                  data-probe={key}
                  data-probe-kind="color"
                  {...(t.varName ? { "data-probe-var": t.varName } : {})}
                  className="h-9 w-12 rounded-md border border-border"
                  style={{ background: paint }}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {t.varName ?? "— no token —"}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                  <span className="text-xs text-muted-foreground/80">{t.use}</span>
                </span>
                <Mono>{t.expected ?? "— design silent —"}</Mono>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Mono>{actual ?? "…"}</Mono>
                  {raw ? <Mono>var: {raw}</Mono> : null}
                </span>
                <Chip
                  verdict={compare(t.expected, actual, `colour:${key}`)}
                  exceptionId={exceptionFor(`colour:${key}`)?.id}
                />
              </div>
            );
          })}
        </Panel>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- typography */

function TypeRows({ measured }: { measured: Measured }) {
  return (
    <Panel
      id="tok-type"
      title="Typography"
      note="Weight and tracking are per-role utilities, never baked into the --text-* steps — baking weight in would bold every default string in every primitive. Line-height is the exposed gap: the design declares 1.2 / 1.3 / 1.6, Tailwind's stock steps ship 32px / 28px / 20px."
    >
      <div className="grid grid-cols-[minmax(0,1fr)_240px_240px] gap-4 bg-background px-4 py-2.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        <span>Specimen</span>
        <span>Design declares</span>
        <span>App resolves</span>
      </div>
      {TYPE_STEPS.map((s) => {
        const size = measured[`${s.role}.size`];
        const weight = measured[`${s.role}.weight`];
        const leading = measured[`${s.role}.leading`];
        const tracking = measured[`${s.role}.tracking`];
        return (
          <div
            key={s.role}
            className="grid grid-cols-[minmax(0,1fr)_240px_240px] items-baseline gap-4 border-t border-muted px-4 py-4"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span data-probe={s.role} data-probe-kind="type" className={s.className}>
                {s.sample}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {s.role} · {s.className}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <Mono>size {s.expectedSize}</Mono>
              <Mono>weight {s.expectedWeight}</Mono>
              <Mono>leading {s.expectedLineHeight ?? "— silent —"}</Mono>
              <Mono>tracking {s.expectedTracking ?? "— silent —"}</Mono>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <Mono>size {size ?? "…"}</Mono>
                <Chip
                  verdict={compare(s.expectedSize, size, `type:${s.role}.size`)}
                  exceptionId={exceptionFor(`type:${s.role}.size`)?.id}
                />
              </span>
              <span className="flex items-center gap-2">
                <Mono>weight {weight ?? "…"}</Mono>
                <Chip
                  verdict={compare(s.expectedWeight, weight, `type:${s.role}.weight`)}
                  exceptionId={exceptionFor(`type:${s.role}.weight`)?.id}
                />
              </span>
              <span className="flex items-center gap-2">
                <Mono>leading {leading ?? "…"}</Mono>
                <Chip
                  verdict={compare(s.expectedLineHeight, leading, `type:${s.role}.leading`)}
                  exceptionId={exceptionFor(`type:${s.role}.leading`)?.id}
                />
              </span>
              <span className="flex items-center gap-2">
                <Mono>tracking {tracking ?? "…"}</Mono>
                <Chip
                  verdict={compare(s.expectedTracking, tracking, `type:${s.role}.tracking`)}
                  exceptionId={exceptionFor(`type:${s.role}.tracking`)?.id}
                />
              </span>
            </span>
          </div>
        );
      })}
    </Panel>
  );
}

/* -------------------------------------------------------- radius / spacing */

function RadiusRows({ measured }: { measured: Measured }) {
  return (
    <Panel
      id="tok-radius"
      title="Radius"
      note="Radius climbs with the size of the surface: controls 6–8px, buttons 10px, panels 14px, feature cards 16px. All six derive from --radius: 0.625rem except 2xl, which the design pins to Tailwind's stock 1rem."
    >
      <div className="flex flex-wrap gap-5 p-4">
        {RADIUS_STEPS.map((r) => {
          const actual = measured[r.label];
          return (
            <div key={r.label} className="flex w-40 flex-col gap-1.5">
              <span
                data-probe={r.label}
                data-probe-kind="radius"
                className={`h-14 w-20 border border-primary bg-accent ${r.className}`}
              />
              <span className="font-mono text-xs font-semibold">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.use}</span>
              <Mono>
                want {r.expected} · got {actual ?? "…"}
              </Mono>
              <Chip
                verdict={compare(r.expected, actual, `radius:${r.label}`)}
                exceptionId={exceptionFor(`radius:${r.label}`)?.id}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SpaceRows({ measured }: { measured: Measured }) {
  return (
    <Panel
      id="tok-space"
      title="Spacing"
      note="A 4px grid, expressed as flex/grid gap rather than margins. The design adds no spacing tokens — these are Tailwind's stock steps, measured to confirm the base is unshifted."
    >
      <div className="flex flex-col gap-2 p-4">
        {SPACE_STEPS.map((s) => {
          const actual = measured[s.label];
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span
                data-probe={s.label}
                data-probe-kind="size"
                className={`h-4 rounded-sm bg-primary ${s.className}`}
              />
              <span className="w-28 font-mono text-xs text-foreground">{s.label}</span>
              <span className="w-56 text-xs text-muted-foreground">{s.use}</span>
              <Mono>
                want {s.expected} · got {actual ?? "…"}
              </Mono>
              <Chip
                verdict={compare(s.expected, actual, `spacing:${s.label}`)}
                exceptionId={exceptionFor(`spacing:${s.label}`)?.id}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- elevation */

function ShadowRows({ measured }: { measured: Measured }) {
  return (
    <>
      <Panel
        id="tok-elevation"
        title="Elevation — the four the design assigns by role"
        note="Shadows are Tailwind's own primitives, assigned by role rather than hand-tuned by depth. Elevation appears only on hover or selection; every card sits at shadow-xs at rest."
      >
        <div className="flex flex-col gap-5 p-4">
          {SHADOW_ROLES.map((s) => {
            const actual = measured[`role:${s.className}`];
            return (
              <div key={s.className} className="flex items-center gap-4">
                <span
                  data-probe={`role:${s.className}`}
                  data-probe-kind="shadow"
                  className={`h-11 w-20 shrink-0 rounded-lg border border-border bg-card ${s.className}`}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold">
                    {s.role} · <span className="font-mono">{s.className}</span>
                  </span>
                  <Mono>want {s.expected}</Mono>
                  <Mono>got&nbsp; {actual ?? "…"}</Mono>
                </span>
                <span className="ml-auto">
                  <Chip
                    verdict={compare(s.expected, actual, `shadow:${s.className}`)}
                    exceptionId={exceptionFor(`shadow:${s.className}`)?.id}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        id="tok-elevation-ladder"
        title="Elevation — the full utility ladder, unassigned"
        note="Rendered so any aliasing shift is visible: if the starter or shadcn/tailwind.css has moved a step, the role row above will still look plausible while pointing at the wrong rung."
      >
        <div className="flex flex-wrap gap-4 p-4">
          {SHADOW_LADDER.map((cls) => (
            <div key={cls} className="flex w-64 flex-col gap-1.5">
              <span
                data-probe={`ladder:${cls}`}
                data-probe-kind="shadow"
                className={`h-11 w-full rounded-lg border border-border bg-card ${cls}`}
              />
              <span className="font-mono text-xs font-semibold">{cls}</span>
              <Mono>{measured[`ladder:${cls}`] ?? "…"}</Mono>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------- breakpoints */

function BreakpointRows() {
  return (
    <Panel
      id="tok-breakpoints"
      title="Breakpoints"
      note="Tailwind's defaults, unchanged. One step is added for ultra-wide — wide: 1800px — because the sidebar and page padding change there and no default sits at that width."
    >
      <div className="grid grid-cols-[104px_92px_minmax(0,1fr)] gap-3 bg-background px-4 py-2.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        <span>Tailwind</span>
        <span>Width</span>
        <span>Behaviour</span>
      </div>
      {BREAKPOINTS.map((b) => (
        <div
          key={b.name}
          className="grid grid-cols-[104px_92px_minmax(0,1fr)] items-center gap-3 border-t border-muted px-4 py-2.5"
        >
          <span className="font-mono text-xs font-semibold text-primary">{b.name}</span>
          <Mono>{b.width}</Mono>
          <span className="text-xs text-muted-foreground">{b.behaviour}</span>
        </div>
      ))}
    </Panel>
  );
}

/* -------------------------------------------------------------------- entry */

function Scoreboard({ measured }: { measured: Measured }) {
  const scores = scoreByCategory(runChecks(measured));
  const stale = staleExceptions(liveCheckIds());
  const unsigned = unsignedExceptions();

  return (
    <Panel
      id="tok-score"
      title="Match score"
      note="(exact + accepted) ÷ scored. Rows the design is silent on are excluded from the denominator, never counted as passes. Accepted rows stay itemised by exception id — an exception is a visible debt, not an erased one."
    >
      {stale.length > 0 ? (
        <div className="border-b border-destructive-strong/30 bg-destructive-soft px-4 py-3">
          <p className="text-xs font-bold text-destructive-strong">
            REGISTRY ERROR — {stale.length} exception{stale.length > 1 ? "s" : ""} target no live
            check
          </p>
          <p className="mt-1 text-xs text-destructive-strong">
            {stale.map((e) => `${e.id} → ${e.target}`).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-destructive-strong">
            A stale id is an error, not a pass: the check was renamed or removed while the exception
            stayed behind, so a real difference could be waved through by an exception that no
            longer describes anything.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1 p-4">
        {scores.length === 0 ? (
          <span className="font-mono text-xs text-muted-foreground">measuring…</span>
        ) : (
          scores.map((s) => (
            <span
              key={s.category}
              className={`font-mono text-xs ${s.failed > 0 ? "text-destructive-strong" : "text-foreground"}`}
            >
              {formatScore(s)}
              {s.failed > 0 ? (
                <span className="text-muted-foreground"> — {s.failedLabels.join(", ")}</span>
              ) : null}
            </span>
          ))
        )}
      </div>

      {unsigned.length > 0 ? (
        <div className="border-t border-note-border bg-note px-4 py-3">
          <p className="text-xs font-bold text-note-foreground">
            {unsigned.length} registered exception{unsigned.length > 1 ? "s" : ""} not yet signed —
            not in force
          </p>
          <p className="mt-1 text-xs text-note-foreground">
            {unsigned.map((e) => `${e.id} (${e.target})`).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-note-foreground">
            While <span className="font-mono">signedOn</span> is null the row fails normally and the
            score above reflects it. Sign in <span className="font-mono">docs/tokens.md</span> §9,
            then set the date in{" "}
            <span className="font-mono">src/features/token-audit/exceptions.ts</span>.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}

export function SectionRawTokens({ measured }: { measured: Measured }) {
  return (
    <div className="flex flex-col gap-10">
      <Scoreboard measured={measured} />
      <ColorRows measured={measured} />
      <TypeRows measured={measured} />
      <RadiusRows measured={measured} />
      <SpaceRows measured={measured} />
      <ShadowRows measured={measured} />
      <BreakpointRows />
    </div>
  );
}
