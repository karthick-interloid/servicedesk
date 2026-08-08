"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ORG, USER } from "@/features/shell/lib/identity";
import { NAV_GROUPS, findActiveNavItem } from "@/features/shell/lib/nav";

/**
 * Navigation rail for every authenticated route: org header, nav, signed-in user —
 * the order `Update design.dc.html` uses.
 *
 * Widths are measured from that file (`renderVals` → `sbW`, and the narrow branch of
 * `sidebarStyle`): 272px sheet overlay below lg, 252px permanent at lg, 288px at the
 * `--breakpoint-wide` (1800px) step, 72px when railed. They are applied as CSS custom
 * properties — the permanent ones on SidebarProvider in the route-group layout, the
 * sheet one in globals.css — so `ui/sidebar.tsx` stays untouched.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2.5 border-b border-sidebar-border p-3.5 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-extrabold text-sidebar-primary-foreground">
            {ORG.initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold text-foreground">{ORG.name}</span>
            <span className="truncate text-xs text-muted-foreground">{ORG.planSummary}</span>
          </div>
          {/* Org switcher affordance only — it opens nothing in this pass. */}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
          />
          {/* The design shows the collapse control at lg and up only; below that the
              sidebar is a drawer and the trigger lives in the header instead. */}
          <SidebarTrigger className="hidden size-8 shrink-0 border border-border bg-card text-muted-foreground group-data-[collapsible=icon]:ml-0 lg:inline-flex" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-3.5 px-2.5 py-3 group-data-[collapsible=icon]:px-2">
        {NAV_GROUPS.map((group, index) => (
          <SidebarGroup key={group.title ?? `group-${index}`} className="gap-1 p-0">
            {group.title ? (
              // 12px / 700 / .1em caps, per the design's `groupTitleStyle`.
              <SidebarGroupLabel className="h-auto px-3 pt-1.5 pb-0.5 text-xs font-bold tracking-[0.1em] text-muted-foreground/80 uppercase">
                {group.title}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.href === active?.item.href}
                      // 36px row, 12px inset, 18px glyph, 40px square when railed —
                      // the design's `mkItem` style. `text-sidebar-foreground` is not
                      // redundant: the button renders an <a>, and globals.css paints
                      // every bare link with the brand green. `font-medium` → 600 on
                      // the active row replaces the primitive's `font-medium`. All the
                      // colour states are attribute variants, so they still outrank it.
                      className="h-9 px-3 font-medium text-sidebar-foreground group-data-[collapsible=icon]:size-10! data-active:font-semibold [&_svg]:size-[18px]"
                    >
                      <Link href={item.href}>
                        <item.icon aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <Avatar>
            <AvatarFallback className="bg-foreground text-xs font-bold text-background">
              {USER.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-foreground">{USER.name}</span>
            <span className="truncate text-xs text-muted-foreground">{USER.role}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
