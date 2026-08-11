"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderSearch } from "@/features/shell/components/header-search";
import { NotificationMenu } from "@/features/shell/components/notification-menu";
import { ProfileMenu } from "@/features/shell/components/profile-menu";
import type { ShellIdentity } from "@/features/shell/lib/identity";
import { findActiveNavItem } from "@/features/shell/lib/nav";

/**
 * Sticky top bar for every authenticated route.
 *
 * Geometry is measured from `Update design.dc.html`'s own `<header>` and `gqField` —
 * 60px bar, 38px search field, 12px `/` keycap. Where a brief named a different number,
 * the design wins.
 *
 * The search control is a <button>, deliberately: it is the Command palette's trigger,
 * not a text input. It opens nothing yet.
 *
 * `identity` arrives as a prop rather than being fetched here: this is a Client Component
 * (it needs `usePathname`), and `getShellIdentity` reaches `next/headers`. The route-group
 * layout resolves it once and hands it to the sidebar, this bar and the footer.
 */
export function AppHeader({ identity }: { identity: ShellIdentity | null }) {
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);
  const page = active?.item.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-15 shrink-0 items-center gap-2.5 border-b bg-background/95 px-4 backdrop-blur md:px-6 lg:px-8">
      <SidebarTrigger className="size-9 shrink-0 lg:hidden" />

      {/* Below lg the design puts a 16px/700 page title where the search field sits at
          lg and up. It is not a heading element — the page renders its own <h1>. */}
      <span className="min-w-0 flex-1 truncate text-base font-bold text-foreground lg:hidden">
        {page}
      </span>

      {/* 38px typeable field, 420px cap, 9px gap — `gqField`. Results panel is later. */}
      <HeaderSearch className="hidden h-9.5 max-w-[420px] flex-1 gap-[9px] rounded-md border-border bg-muted lg:flex" />

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {/* Below lg the design collapses the field to an icon button. Also inert. */}
        <Button variant="outline" size="icon-lg" aria-label="Search" className="lg:hidden">
          <Search aria-hidden />
        </Button>

        {/* Starter infrastructure the design does not specify — see SHELL-DIFF A13.
            The wrapper chrome is stripped so the three controls read as plain icon
            buttons alongside the bell rather than as a bordered segmented group.

            lg and up only. It is 106px wide, and below lg that is the space the design
            gives its page title, which it truncated to "Das…". The design's own mobile
            header wins; the addition yields. */}
        <ThemeToggle className="hidden border-transparent bg-transparent p-0 lg:inline-flex" />

        <NotificationMenu />
        <ProfileMenu identity={identity} />
      </div>
    </header>
  );
}
