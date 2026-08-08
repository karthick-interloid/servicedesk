import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppFooter } from "@/features/shell/components/app-footer";
import { AppHeader } from "@/features/shell/components/app-header";
import { AppSidebar } from "@/features/shell/components/app-sidebar";
import { SidebarViewportSync } from "@/features/shell/components/sidebar-viewport-sync";

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
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="[--sidebar-width-icon:72px]! [--sidebar-width:252px]! wide:[--sidebar-width:288px]!">
      {/* Closes a drawer left open across the lg boundary — see the component's note. */}
      <SidebarViewportSync />
      <AppSidebar />
      {/* SidebarInset renders the <main> element that wraps the content container. */}
      <SidebarInset className="min-w-0">
        <AppHeader />
        <div className="mx-auto w-full max-w-[2040px] flex-1 px-4 py-6 wide:py-8 md:px-6 lg:px-8">
          {children}
        </div>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
