"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";

import { createSavedViewAction, renameSavedViewAction } from "@/features/tickets/actions";

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
   WIRED. `views` is a real `saved_views` read, per-user-scoped by RLS, and both
   mutations are Server Actions:

     · "New view"  → createSavedViewAction  (owner is always the caller)
     · "Edit"      → renameSavedViewAction  (owner-only, enforced by the UPDATE policy)
     · "Open"      → a real <Link> to /tickets (the only thing that leaves this screen)

   No local copy of the rows is kept. Both actions `revalidatePath("/views")`, so the
   Server Component re-renders and `views` arrives updated — holding a `useState` mirror
   would mean rendering the optimistic guess instead of what the database actually stored,
   and the two disagree the moment a write is refused.

   THERE IS STILL NO DELETE OR SHARE CONTROL HERE, and that is deliberate: the design draws
   neither. `deleteSavedViewAction` and `setSavedViewSharedAction` exist and are RLS-verified
   (see actions.ts), but giving them buttons would mean inventing a row treatment, a
   confirmation and a shared/private affordance the design has never drawn. Logged in
   docs/WIRING-SAVEDVIEWS-REPORTS.md § Deviations.

   The modal's Filter select is rendered because the design renders it, but it is inert:
   it never writes to `filterJson`. The design's own modal is equally inert (its `saveView`
   only fires a toast), and inventing a filter-builder is exactly the kind of thing this
   pass must not do. New views are therefore created with an empty filter — which is a
   legitimate "all tickets" view, not a broken one.
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
   * The caller's saved views: their own (private or shared) plus the tenant's shared ones.
   * That set is produced by the `saved_views_select` policy, not by any filter here.
   *
   * The empty state is NOT a separate prop — it is simply this arriving empty, which is
   * what a tenant with no views produces. Deriving it from the row count rather than a flag
   * is what lets a view created from the empty state replace the empty card immediately.
   */
  views: SavedView[];
}) {
  /* `null` = closed. `{ id: "" }` = the New-view case, which the design distinguishes
     only by its title ("New view" vs "Edit view") — the body is identical. */
  const [editing, setEditing] = useState<EditorTarget>(null);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEmpty = views.length === 0;

  const openNew = () => {
    setEditing({ id: "", name: "" });
    setDraftName("");
    setError(null);
  };

  const openEdit = (view: SavedView) => {
    setEditing({ id: view.id, name: view.name });
    setDraftName(view.name);
    setError(null);
  };

  const save = () => {
    const name = draftName.trim();
    if (!editing || name.length === 0 || isPending) return;

    setError(null);

    startTransition(async () => {
      const result =
        editing.id === ""
          ? await createSavedViewAction({ name })
          : await renameSavedViewAction({ id: editing.id, name });

      // The modal stays open on failure. Closing it would discard what the user typed and
      // leave the list looking as though the change had landed.
      if (!result.success) {
        setError(result.message);
        return;
      }

      setEditing(null);
    });
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
          {views.map((view) => (
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

          {/* The design draws no error treatment for this modal — it has no failing save to
              draw one for. This borrows the destructive-ink alert line the new-ticket sheet
              already uses, rather than inventing a second error language. */}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2.5">
            <Button variant="neutral" size="touch" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            {/* Never disabled: the standing rule is hide-don't-disable, and the design's
                own Save is always live. An empty name is refused inside `save()`, and so is
                a second click while the first is still in flight — `aria-busy` is the only
                thing that changes, since the design draws no pending treatment. */}
            <Button
              size="touch"
              onClick={save}
              aria-busy={isPending}
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
