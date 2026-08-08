import { ORG } from "@/features/shell/lib/identity";

/**
 * The shell's bottom strip, transcribed from `Update design.dc.html` (and its React
 * port, `react/app/-app-/layout.tsx`): product · org, three utility entries, and the
 * build number right-aligned in mono.
 *
 * Status / Docs / Keyboard shortcuts render as text, not links: none of those routes
 * exists yet, and a dead <a> is worse than a plain label. Promote them to <Link> when
 * the destinations land.
 */
export function AppFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[2040px] flex-wrap items-center gap-3 border-t px-4 py-3 text-xs text-muted-foreground md:px-6 lg:px-8">
      <span>ServiceDesk Pro · {ORG.name}</span>
      <span aria-hidden>·</span>
      <span>Status</span>
      <span>Docs</span>
      <span>Keyboard shortcuts</span>
      <span className="ml-auto font-mono">v3.14</span>
    </footer>
  );
}
