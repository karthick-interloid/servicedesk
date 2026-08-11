"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, CircleAlert, Paperclip } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slaStateTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

import { addMessageAction, updateTicketAction } from "../actions";
import { formatSla, formatUpdated } from "../lib/queue-format";
import { formatBytes } from "../lib/attachments";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type AssigneeOption,
  type TicketDetail as TicketDetailData,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from "../types";

const UNASSIGNED = "unassigned";

/** Two initials from a display name. */
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** `Today, 09:12` for anything today, else a short date — matching the capture. */
function messageStamp(iso: string, now: number) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const isToday = new Date(now).toDateString() === date.toDateString();

  return isToday
    ? `Today, ${time}`
    : `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * `/tickets/[id]`.
 *
 * A Client Component because almost everything on it writes: the composer, the three
 * property selects. The read happens in the page above and arrives whole, so this never
 * touches Supabase — the same split the queue uses.
 *
 * `now` is stamped by the server and passed down, so the SLA countdown and the "Today,
 * 09:12" stamps render identically on both sides of hydration.
 */
export function TicketDetail({
  ticket,
  assignees,
  now,
}: {
  ticket: TicketDetailData;
  assignees: AssigneeOption[];
  now: number;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isSending, startSending] = useTransition();

  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sla = formatSla(ticket.slaEvent, now, ticket.createdAt);

  /** One handler for all three property selects — they differ only in the field they set. */
  function save(patch: Parameters<typeof updateTicketAction>[0]) {
    setError(null);

    startSaving(async () => {
      const result = await updateTicketAction(patch);

      if (!result.success) {
        setError(result.message);
        return;
      }

      // The action revalidated this route; refresh is what re-renders the server component
      // above with the saved value rather than leaving the select optimistic and unbacked.
      router.refresh();
    });
  }

  function send() {
    setError(null);

    startSending(async () => {
      const result = await addMessageAction({ ticketId: ticket.id, body, visibility });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setBody("");
      router.refresh();
    });
  }

  const requesterLine = [ticket.requester.fullName, ticket.requester.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="quiet" size="sm" className="-ml-2 w-fit text-brand-accent">
        <Link href="/tickets">
          <ChevronLeft className="size-4" aria-hidden />
          Back to queue
        </Link>
      </Button>

      {/* ---- Header ------------------------------------------------------- */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm text-muted-foreground">#{ticket.number}</span>
          {sla ? (
            <Badge tone={slaStateTone[sla.state]} dot>
              {sla.label}
            </Badge>
          ) : null}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-balance">{ticket.subject}</h1>

        <p className="text-sm text-muted-foreground">
          Opened by {requesterLine} · last activity {formatUpdated(ticket.updatedAt, now)}
        </p>
      </div>

      {error ? (
        <Alert tone="error" className="rounded-[10px] px-3.5 py-3">
          <CircleAlert className="size-[18px]" aria-hidden />
          <AlertDescription className="text-sm leading-[1.55]">{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* The design's two-column split: thread, then a 320px properties rail. Below xl the
          rail drops under the thread rather than squeezing both. */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ol className="flex flex-col gap-3.5">
            {ticket.messages.map((message) => (
              <Message key={message.id} message={message} now={now} />
            ))}
          </ol>

          {/* ---- Composer -------------------------------------------------- */}
          <Card className="gap-0 overflow-hidden p-0">
            <div
              role="tablist"
              aria-label="Reply type"
              className="flex items-center gap-1 border-b px-3.5 py-3"
            >
              {(
                [
                  ["public", "Public reply"],
                  ["internal", "Internal note"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={visibility === value}
                  onClick={() => setVisibility(value)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-lg border border-transparent px-3 text-sm font-semibold transition-colors",
                    visibility === value
                      ? "border-brand-accent/40 bg-brand-accent/8 text-brand-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="px-3.5 py-3">
              <Label htmlFor="ticket-reply" className="sr-only">
                {visibility === "public" ? "Public reply" : "Internal note"}
              </Label>
              <Textarea
                id="ticket-reply"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={
                  visibility === "public"
                    ? `Write a reply to ${ticket.requester.fullName}…`
                    : "Write a note only your team can see…"
                }
                className="min-h-24 resize-y border-0 p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-t px-3.5 py-3">
              {/* The design puts an Attach button here. Omitted rather than rendered inert:
                  uploading needs a signed upload to the `ticket_attachments` bucket and an
                  `attachments` row, which this slice does not build. A button that does
                  nothing is worse than one that isn't there — see TICKETS-DIFF D4. */}
              <span className="text-xs text-muted-foreground">
                {visibility === "public"
                  ? "Sends by email and shows on the portal."
                  : "Only your team can see this. It never reaches the customer."}
              </span>

              <Button
                type="button"
                disabled={isSending || body.trim() === ""}
                onClick={send}
                className={cn(
                  "ml-auto min-h-11 font-semibold md:min-h-10",
                  visibility === "public"
                    ? "bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                    : "bg-note-foreground text-note hover:bg-note-foreground/90",
                )}
              >
                {isSending
                  ? "Sending…"
                  : visibility === "public"
                    ? "Send public reply"
                    : "Add internal note"}
              </Button>
            </div>
          </Card>
        </div>

        {/* ---- Properties rail --------------------------------------------- */}
        <aside className="flex w-full shrink-0 flex-col gap-3.5 xl:w-[320px]">
          <Card className="gap-3.5 p-3.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-full bg-muted-foreground text-xs font-bold text-background"
              >
                {initials(ticket.requester.fullName)}
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-bold">{ticket.requester.fullName}</span>
                {ticket.requester.company ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {ticket.requester.company}
                  </span>
                ) : null}
              </span>
            </div>

            <PropertySelect
              id="ticket-status"
              label="Status"
              value={ticket.status}
              disabled={isSaving}
              options={(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABEL[s],
              }))}
              onChange={(value) => save({ ticketId: ticket.id, status: value as TicketStatus })}
            />

            <PropertySelect
              id="ticket-priority"
              label="Priority"
              value={ticket.priority}
              disabled={isSaving}
              options={(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => ({
                value: p,
                label: PRIORITY_LABEL[p],
              }))}
              onChange={(value) => save({ ticketId: ticket.id, priority: value as TicketPriority })}
            />

            <PropertySelect
              id="ticket-assignee"
              label="Assignee"
              value={ticket.assignee?.id ?? UNASSIGNED}
              disabled={isSaving}
              options={[
                { value: UNASSIGNED, label: "Unassigned" },
                ...assignees.map((user) => ({ value: user.id, label: user.fullName })),
              ]}
              onChange={(value) =>
                save({
                  ticketId: ticket.id,
                  assigneeUserId: value === UNASSIGNED ? null : value,
                })
              }
            />

            {ticket.tags.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-foreground">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag.id} tone="neutral">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* SLA. Only the resolution clock is stored — see the note in TICKETS-DIFF. */}
          {sla ? (
            <Card className="gap-2.5 p-3.5">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                SLA
              </span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">Resolution</span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      sla.state === "breached" ? "text-destructive" : "text-warning-strong",
                      (sla.state === "on_track" || sla.state === "met") && "text-success-strong",
                    )}
                  >
                    {sla.label}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      sla.state === "breached" && "w-full bg-destructive",
                      sla.state === "at_risk" && "w-4/5 bg-warning",
                      sla.state === "on_track" && "w-1/3 bg-success",
                      sla.state === "met" && "w-full bg-success",
                    )}
                  />
                </div>
              </div>
            </Card>
          ) : null}

          {ticket.attachments.length > 0 ? (
            <Card className="gap-2.5 p-3.5">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Attachments
              </span>
              <ul className="flex flex-col gap-2">
                {ticket.attachments.map((file) => (
                  <li key={file.id} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-muted-foreground uppercase"
                    >
                      {(file.extension ?? file.mime.split("/")[1] ?? "file").slice(0, 3)}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-semibold">{file.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {/* Metadata only — no download link, because a `storage_path` needs a signed
                  URL per file and that ships with the upload path. */}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="size-3" aria-hidden />
                Download arrives with attachment upload.
              </span>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/** The rail's three selects differ only in their options, so they share one shape. */
function PropertySelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-bold text-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="min-h-11 w-full md:min-h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * One message.
 *
 * Three treatments, measured from `ticket-detail--light.png`: a customer message is the
 * plain card (`#FFFFFF` + border), an agent reply is tinted (`#F5FAF9`, which is
 * `--brand-accent` at 4%), and an internal note takes the note triple (`#FEF3C7` /
 * `#92400E`) and says so in a badge — the one visual difference that carries a disclosure
 * rule rather than a preference.
 */
function Message({ message, now }: { message: TicketMessage; now: number }) {
  const isInternal = message.visibility === "internal";
  const isAgent = message.authorType === "agent";

  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={cn(
          "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          isInternal
            ? "bg-note-foreground text-note"
            : isAgent
              ? "bg-brand-accent text-brand-accent-foreground"
              : "bg-muted-foreground text-background",
        )}
      >
        {initials(message.authorName)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{message.authorName}</span>
          {isInternal ? (
            <Badge tone="warning" className="bg-note text-note-foreground ring-note-border">
              Internal note
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {messageStamp(message.createdAt, now)}
          </span>
          {message.isEdited ? (
            <span className="text-xs text-muted-foreground">· edited</span>
          ) : null}
        </div>

        <div
          className={cn(
            "rounded-xl border px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isInternal
              ? "border-note-border bg-note text-note-foreground"
              : isAgent
                ? "border-transparent bg-brand-accent/4"
                : "bg-card",
          )}
        >
          {message.body}
        </div>
      </div>
    </li>
  );
}
