"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ORG, USER } from "@/features/shell/lib/identity";

/**
 * Account menu, from `Update design.dc.html` → `avatarPanel`: a 240px panel whose head
 * block is the user's name over "role · org", then Profile settings, Keyboard shortcuts
 * and a destructive Sign out. Those are the design's three items verbatim — nothing here
 * is invented, and nothing is added.
 *
 * Every item is wired but opens nothing: the design routes the first two into dialogs and
 * the third into the login screen, none of which exist yet.
 */
export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* 44px tall, 6px inset, 8px radius, transparent border — the design's trigger. */}
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-11 items-center gap-2 rounded-md border border-transparent px-1.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-expanded:bg-muted"
        >
          <Avatar>
            <AvatarFallback className="bg-foreground text-xs font-bold text-background">
              {USER.initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden flex-col items-start leading-tight lg:flex">
            <span className="text-xs font-semibold text-foreground">{USER.name}</span>
            <span className="text-xs text-muted-foreground">{USER.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl p-0">
        <DropdownMenuLabel className="flex flex-col gap-0.5 border-b px-3.5 py-3 font-normal">
          <span className="text-sm font-semibold text-foreground">{USER.name}</span>
          <span className="text-xs text-muted-foreground">
            {USER.role} · {ORG.name}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="hidden" />
        <div className="p-1.5">
          {/* TODO: dialog later — the design opens a Profile settings dialog here. */}
          <DropdownMenuItem className="h-9.5 px-3 text-sm font-medium">
            Profile settings
          </DropdownMenuItem>
          {/* TODO: dialog later — the design opens the shortcuts reference here. */}
          <DropdownMenuItem className="h-9.5 px-3 text-sm font-medium">
            Keyboard shortcuts
          </DropdownMenuItem>
          {/* TODO: dialog later — the design returns to the login screen; no auth yet. */}
          <DropdownMenuItem variant="destructive" className="h-9.5 px-3 text-sm font-medium">
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
