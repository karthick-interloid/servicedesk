"use client";

import { useRef } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTheme } from "@/context/theme-provider";
import { SectionPrimitives } from "@/features/token-audit/components/section-primitives";
import { SectionRawTokens } from "@/features/token-audit/components/section-raw-tokens";
import { useMeasured } from "@/features/token-audit/use-measured";

export function TokenBoard() {
  const scope = useRef<HTMLDivElement>(null);
  const measured = useMeasured(scope);
  const { resolvedTheme } = useTheme();

  return (
    <div ref={scope} className="mx-auto flex max-w-[1240px] flex-col gap-14 px-10 pt-8 pb-24">
      <header className="flex flex-col gap-3">
        <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Interloid · ServiceDesk Pro
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Token board</h1>
        <p className="max-w-[74ch] text-sm text-muted-foreground">
          Every value in <span className="font-mono text-xs">src/app/globals.css</span>, resolved by
          the browser and diffed against what{" "}
          <span className="font-mono text-xs">Design System.dc.html</span> declares. Section A is
          the raw token layer; Section B is stock shadcn primitives inheriting it with no custom
          classes. When a component looks wrong, the swatch above tells you whether the token or the
          component&rsquo;s usage of it is at fault.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <ThemeToggle />
          <span
            className="font-mono text-xs text-muted-foreground"
            data-testid="resolved-theme"
            data-resolved-theme={resolvedTheme}
          >
            resolved theme: {resolvedTheme}
          </span>
        </div>
        <p className="max-w-[74ch] rounded-lg border border-note-border bg-note p-3 text-xs text-note-foreground">
          <strong>Dark is unscored.</strong>{" "}
          <span className="font-mono">Design System.dc.html</span> declares no dark rules at all —
          zero <span className="font-mono">.dark</span> selectors, zero{" "}
          <span className="font-mono">prefers-color-scheme</span>. Dark values here come from{" "}
          <span className="font-mono">react/app/globals.css</span>, so in dark theme every verdict
          below reads <em>differs</em> against a light-theme expectation. Score the light column
          only.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Section A
          </span>
          <h2 className="text-xl font-bold tracking-tight">Raw tokens</h2>
          <p className="max-w-[74ch] text-sm text-muted-foreground">
            In the design page&rsquo;s own presentation order: colour, typography, radius, spacing,
            elevation, breakpoints.
          </p>
        </div>
        <SectionRawTokens measured={measured} />
      </section>

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Section B
          </span>
          <h2 className="text-xl font-bold tracking-tight">Stock primitives, inheriting</h2>
          <p className="max-w-[74ch] text-sm text-muted-foreground">
            No custom classes, so anything that looks wrong here is either a token defect (check
            Section A) or the component&rsquo;s own internal usage — never this page.
          </p>
        </div>
        <SectionPrimitives />
      </section>
    </div>
  );
}
