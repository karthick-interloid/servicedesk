import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppFooter } from "@/features/shell/components/app-footer";
import { AppHeader } from "@/features/shell/components/app-header";
import { AppSidebar } from "@/features/shell/components/app-sidebar";
import { SidebarViewportSync } from "@/features/shell/components/sidebar-viewport-sync";
import { getShellIdentity } from "@/features/shell/lib/identity";

/**
 * Shell for every authenticated route. Nests inside the root layout — it adds no
 * <html>/<body>, only the sidebar, the top bar, the content container and the strip.
 *
 * The permanent sidebar widths are measured from `Update design.dc.html`
 * (`sbW = rail ? 72 : ultra ? 288 : 252`, with `ultra` = 1800px = --breakpoint-wide).
 * They go on as `!important` arbitrary properties because SidebarProvider writes its
 * own 16rem/3rem defaults as *inline* styles, which a plain class cannot outrank — and
 * ui/sidebar.tsx is not ours to edit. The sheet-drawer width lives in globals.css for
 * the same reason; see the note there.
 *
 * Identity is fetched HERE, once, and passed down. `getShellIdentity` reaches
 * `next/headers` through the Supabase server client, so it can only be called from a
 * Server Component — and the sidebar and the top bar are both `"use client"` (they need
 * `usePathname` and a dropdown). Importing it from either of them pulls a server-only
 * module into the client graph and the whole route group fails to compile. Passing the
 * resolved object down as a prop is what keeps that boundary intact, and it also means
 * one round trip for the three chrome components instead of three.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const identity = await getShellIdentity();

  return (
    <SidebarProvider className="[--sidebar-width-icon:72px]! [--sidebar-width:252px]! wide:[--sidebar-width:288px]!">
      {/* Closes a drawer left open across the lg boundary — see the component's note. */}
      <SidebarViewportSync />
      <AppSidebar identity={identity} />
      {/* SidebarInset renders the <main> element that wraps the content container. */}
      <SidebarInset className="min-w-0">
        <AppHeader identity={identity} />
        <div className="mx-auto w-full max-w-[2040px] flex-1 px-4 py-6 wide:py-8 md:px-6 lg:px-8">
          {children}
        </div>
        <AppFooter identity={identity} />
      </SidebarInset>
    </SidebarProvider>
  );
}
