"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SavedView } from "../types";

/* ---------------------------------------------------------------------------
   PRESENTATIONAL ONLY — NOTHING HERE PERSISTS.

   Every mutation below edits `useState` and stops there: no server action, no fetch,
   no supabase-js. Reloading the page restores the mock rows. Specifically:

     · "New view"  → appends a row to local state
     · "Edit"      → opens the modal, and Save renames the row in local state
     · "Open"      → a real <Link> to /tickets (the only thing that leaves this screen)

   There is NO delete, duplicate or share action, because the design has none — the row
   ends at Edit + Open. See docs/SAVED-VIEWS-DIFF.md § "Not in the design".

   The modal's Filter select is rendered because the design renders it, but it is inert:
   it never writes to `filterJson`. The design's own modal is equally inert (its `saveView`
   only fires a toast), and inventing a filter-builder is exactly the kind of thing this
   pass must not do.
   --------------------------------------------------------------------------- */

/* Measured off `Update design.dc.html` → `barGhost`: 34px tall from md up, the 44px tap
   target below it, 12px inset, radius 8, 12px/600 in the muted ink. The stock `ghost`
   variant supplies the hover; only the metrics and the type scale are overridden. */
const EDIT_BUTTON = "text-xs font-semibold text-muted-foreground md:h-[34px]";

/* The design's `Open` is the DS ghost button at `size="sm"` (34px), which paints its label
   in the brand accent — the capture measures teal, not the muted grey `Edit` sits in. */
const OPEN_BUTTON = "text-xs font-semibold text-brand-accent md:h-[34px]";

/** The three canned predicates the design's Filter select offers, verbatim and in order. */
const FILTER_PRESETS = ["Status is Open or Pending", "Assignee is me", "SLA is breaching"] as const;

type EditorTarget = { id: string; name: string } | null;

export function SavedViewsList({
  views,
}: {
  /**
   * The mock rows. Real source: the per-user-scoped `saved_views` query.
   *
   * The empty state is NOT a separate prop — it is simply this arriving empty, which is
   * what `?state=empty` produces (see `page.tsx`) and what a real tenant with no views
   * would produce. Deriving it from the row count rather than a flag is what lets a view
   * created from the empty state replace the empty card immediately.
   */
  views: SavedView[];
}) {
  const [rows, setRows] = useState<SavedView[]>(views);

  /* `null` = closed. `{ id: "" }` = the New-view case, which the design distinguishes
     only by its title ("New view" vs "Edit view") — the body is identical. */
  const [editing, setEditing] = useState<EditorTarget>(null);
  const [draftName, setDraftName] = useState("");

  const isEmpty = rows.length === 0;

  const openNew = () => {
    setEditing({ id: "", name: "" });
    setDraftName("");
  };

  const openEdit = (view: SavedView) => {
    setEditing({ id: view.id, name: view.name });
    setDraftName(view.name);
  };

  const save = () => {
    const name = draftName.trim();
    if (!editing || name.length === 0) return;

    if (editing.id === "") {
      // A new row carries the same shape as a fetched one so the list stays homogeneous.
      // The ids and timestamps are local fictions — the database assigns both.
      const now = new Date().toISOString();
      setRows((prev) => [
        ...prev,
        {
          id: `sv-local-${prev.length + 1}`,
          tenantId: prev[0]?.tenantId ?? "t-northwind",
          ownerUserId: prev[0]?.ownerUserId ?? "u-sam-okafor",
          owner: prev[0]?.owner ?? { id: "u-sam-okafor", fullName: "Sam Okafor" },
          name,
          filterJson: {},
          isShared: false,
          ticketCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } else {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, name } : r)));
    }

    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* ---- Page header ------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Saved views</h1>
          <p className="text-sm text-muted-foreground">
            Shared filters your team works from. Order sets the tab order on the queue.
          </p>
        </div>

        <Button
          size="touch"
          onClick={openNew}
          className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
        >
          New view
        </Button>
      </div>

      {isEmpty ? (
        /* ---- Empty -----------------------------------------------------
           NOT IN THE DESIGN. `scrViews` has no `stEmpty` branch, the capture report
           registers only `["Default"]` for this screen, and no `saved-views--empty`
           capture exists. This borrows the pattern the same file uses for SLA policies
           (44px/24px card, 16px/700 heading, 420px measure, primary CTA) so the screen
           has a designed-looking floor instead of an empty card. Logged as a deviation. */
        <Card className="items-center gap-3 rounded-[14px] px-6 py-11 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-accent/8 text-brand-accent">
            <Bookmark className="size-5" aria-hidden />
          </span>
          <h2 className="text-base font-bold">No saved views yet</h2>
          <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
            A saved view is a filter your team opens from the queue as a tab. Create one, and it
            appears for everyone working this inbox.
          </p>
          <Button
            size="touch"
            onClick={openNew}
            className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            New view
          </Button>
        </Card>
      ) : (
        /* ---- Populated --------------------------------------------------
           `cardPlain` in the design: white, 1px border, radius 14, overflow hidden and
           NO padding of its own — every row supplies its own 14px/16px inset. */
        <Card className="gap-0 rounded-[14px] p-0">
          {rows.map((view) => (
            <div
              key={view.id}
              /* The design's `rowCard`: flex-wrap so the actions drop under a long name
                 at 375 rather than squashing it. `border-t` on EVERY row, including the
                 first — that is what the design does, and the capture shows the doubled
                 hairline against the card's own darker edge. */
              className="flex flex-wrap items-center gap-3 border-t border-muted px-4 py-3.5"
            >
              {/* The design leaves the glyph, the name and the count as three siblings in
                  the wrapping flex. Grouping the first two changes NOTHING for the five
                  views the design ships — none is long enough to wrap at any breakpoint —
                  but it stops a long name from wrapping away and stranding the bookmark
                  alone on its own line, which two of the mock rows otherwise do at 375. */}
              <span className="flex min-w-0 items-center gap-3">
                <Bookmark
                  aria-hidden
                  className="size-4.5 shrink-0 text-muted-foreground/70"
                  strokeWidth={1.7}
                />
                <span className="text-sm font-semibold text-foreground">{view.name}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {view.ticketCount} tickets
              </span>

              <span className="ml-auto flex items-center gap-1.5">
                {/* The label is the design's bare "Edit"/"Open", which is ambiguous once
                    ten rows carry it — so each gets an `aria-label` naming its view. An
                    `sr-only` span would read the same but would also add a second text
                    node holding the view's name, which is a trap for anything matching on
                    text (the e2e suite included). */}
                <Button
                  variant="ghost"
                  size="touch-sm"
                  className={EDIT_BUTTON}
                  aria-label={`Edit ${view.name}`}
                  onClick={() => openEdit(view)}
                >
                  Edit
                </Button>
                {/* The one action that actually goes somewhere. The design also preselects
                    the view on arrival; the queue holds its active view in local state and
                    reads no search param, so wiring that up belongs with the queue. */}
                <Button variant="ghost" size="touch-sm" className={OPEN_BUTTON} asChild>
                  <Link href="/tickets" aria-label={`Open ${view.name}`}>
                    Open
                  </Link>
                </Button>
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* ---- New / Edit view modal ---------------------------------------
          460px at md+ and a bottom sheet below it, per the design's `modalStyle`. The
          fields are exactly what the design shows: a name and a canned filter. */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="gap-4 rounded-2xl p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-115">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold">
              {editing?.id === "" ? "New view" : "Edit view"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Name this view and choose the filter it applies to the queue.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saved-view-name" className="font-semibold">
              View name
            </Label>
            <Input
              id="saved-view-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Waiting on engineering"
              className="min-h-11 md:min-h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saved-view-filter" className="font-semibold">
              Filter
            </Label>
            {/* Inert by design — see the header note. */}
            <Select defaultValue={FILTER_PRESETS[0]}>
              <SelectTrigger id="saved-view-filter" className="min-h-11 w-full md:min-h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap justify-end gap-2.5">
            <Button variant="neutral" size="touch" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            {/* Never disabled: the standing rule is hide-don't-disable, and the design's
                own Save is always live. An empty name is refused inside `save()`. */}
            <Button
              size="touch"
              onClick={save}
              className="bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
            >
              Save view
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
