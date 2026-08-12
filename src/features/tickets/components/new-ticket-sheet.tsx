"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Paperclip, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createTicketAction } from "../actions";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  formatBytes,
  rejectAttachment,
} from "../lib/attachments";
import { newTicketSchema, type NewTicketValues } from "../schemas/new-ticket";
import { PRIORITY_LABEL, type CustomerOption, type TicketPriority } from "../types";

/** Spelt out to match the design's "Two fields need attention…" wording. */
const COUNT_WORD = ["", "One", "Two", "Three", "Four", "Five"];

/**
 * New ticket, as a right-hand sheet rather than its own route.
 *
 * The design draws it as a 480px drawer over the queue, which is also the right container:
 * raising a ticket is something an agent does *while reading the queue* — the row they were
 * looking at is the context, and a route change throws that away along with their filters,
 * sort, page and selection.
 *
 * Fields are Subject → Requester → Priority → Description → attachments, in that order,
 * from `Update design.dc.html`'s New ticket drawer. The Company and Assignee controls an
 * earlier revision drew are gone with it: company is a property of the customer record
 * (`customers.company`) and was already read-only here, and a ticket is assigned from the
 * queue or from the ticket itself, so it is created unassigned.
 *
 * Everything the pickers need is passed in. A sheet that fetched its own customers would
 * either do it on every render or block the first open on a round trip, and the queue page
 * is already a Server Component that can ask for all of it in the same pass.
 */
export function NewTicketSheet({
  customers,
  trigger,
}: {
  customers: CustomerOption[];
  /** The button that opens it — the header's primary and the empty state's both do. */
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  /*
   * Files chosen but not yet uploaded.
   *
   * They cannot go up with the ticket: `ticket_attachments_insert` keys the object path on
   * `<tenant>/<ticket>/…`, so there is nowhere to put them until the ticket has an id. So
   * the sheet stages them and posts them straight after the create returns.
   */
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const form = useForm<NewTicketValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      subject: "",
      requesterCustomerId: "",
      priority: "normal",
      description: "",
      // No control draws this — see the schema. Present so the resolver has the key it
      // requires, and so a ticket raised here is explicitly unassigned rather than absent.
      assigneeUserId: null,
    },
  });

  function reset() {
    form.reset();
    setFiles([]);
    setFileError(null);
    setDragging(false);
  }

  /**
   * Stage what we can and say why the rest was refused.
   *
   * Refusing at selection is the point: the alternative is the user waiting on a 20 MB
   * POST to be told the file was never eligible. The server re-checks all of it —
   * `rejectAttachment` is the same function on both sides.
   */
  function addFiles(incoming: FileList | File[]) {
    const accepted: File[] = [];
    const refusals: string[] = [];

    for (const file of incoming) {
      const reason = rejectAttachment(file);

      if (reason) {
        refusals.push(`${file.name} — ${reason}`);
        continue;
      }

      // Same name and size twice is the double-drop, not two real files.
      const duplicate = [...files, ...accepted].some(
        (existing) => existing.name === file.name && existing.size === file.size,
      );

      if (!duplicate) accepted.push(file);
    }

    const room = ATTACHMENT_MAX_FILES - files.length;

    if (accepted.length > room) {
      refusals.push(`Only ${ATTACHMENT_MAX_FILES} files can be attached at a time.`);
    }

    setFiles((current) => [...current, ...accepted.slice(0, Math.max(room, 0))]);
    setFileError(refusals[0] ?? null);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setFileError(null);
  }

  /**
   * Post the staged files at the ticket that now exists.
   *
   * Deliberately does not throw: the ticket is already created by the time this runs, so a
   * failure here must not look like the create failed, or the user raises it a second time.
   * It reports instead, and the caller closes the sheet either way.
   */
  async function uploadFiles(ticketId: string): Promise<string | null> {
    const body = new FormData();
    for (const file of files) body.append("files", file);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message: unknown }).message)
            : "We couldn't attach those files.";

        return message;
      }

      const rejected =
        payload && typeof payload === "object" && "rejected" in payload
          ? ((payload as { rejected: { filename: string }[] }).rejected ?? [])
          : [];

      if (rejected.length > 0) {
        return `${rejected.length} of ${files.length} files didn't attach.`;
      }

      return null;
    } catch {
      return "We couldn't attach those files.";
    }
  }

  function onSubmit(values: NewTicketValues) {
    form.clearErrors("root");

    startTransition(async () => {
      const result = await createTicketAction(values);

      if (!result.success) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          const message = messages?.[0];
          if (message) form.setError(field as keyof NewTicketValues, { message });
        }

        form.setError("root", { message: result.message });
        return;
      }

      const uploadError = files.length > 0 ? await uploadFiles(result.data.id) : null;

      setOpen(false);
      reset();

      // The action revalidated `/tickets`; this is what makes the open queue behind the
      // sheet actually re-render with the new row rather than serve the cached payload.
      router.refresh();

      if (uploadError) {
        // The ticket exists and is in the queue — only the files failed, and saying so in a
        // toast keeps that true without holding a created ticket's form open.
        toast.error(`Ticket #${result.data.number} was created, but ${uploadError}`);
      }
    });
  }

  const rootError = form.formState.errors.root;

  /*
   * The design's error state is a banner over the fields that counts them. `root` covers a
   * rejected submit; the count covers the client-side one, where every message is already
   * under its own field and the banner is what says how many there are.
   */
  const fieldErrorCount = (Object.keys(form.formState.errors) as string[]).filter(
    (key) => key !== "root",
  ).length;

  const summary =
    rootError?.message ??
    (fieldErrorCount > 0
      ? `${COUNT_WORD[fieldErrorCount] ?? fieldErrorCount} field${
          fieldErrorCount === 1 ? "" : "s"
        } need${fieldErrorCount === 1 ? "s" : ""} attention before this ticket can be created.`
      : null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Closing discards the draft. Reopening onto a half-filled form the user thought
        // they had abandoned is worse than losing four fields.
        if (!next) reset();
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        side="right"
        // The stock sheet caps at `sm:max-w-sm` (384px); the design's drawer is 480.
        className="w-full gap-0 p-0 sm:max-w-[480px]"
        // The design puts the close control inside the bordered header, in flow with the
        // title, rather than floating over the first field.
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between gap-3 border-b p-4">
          <SheetTitle className="text-[18px] font-bold tracking-tight">New ticket</SheetTitle>
          {/* The design drops the subtitle an earlier revision had. Kept for screen
              readers only, because Radix's Dialog wants a description either way. */}
          <SheetDescription className="sr-only">
            Raise a ticket on a customer&apos;s behalf. They&apos;ll get a copy by email.
          </SheetDescription>
          <SheetClose asChild>
            {/* 44px square at every viewport, as the design draws it — it is what sets the
                header's height, not the 18px title. */}
            <Button variant="quiet" size="icon" className="-mr-1.5 size-11 text-muted-foreground">
              <X className="size-4.5" aria-hidden />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              {summary ? (
                <Alert tone="error" className="rounded-[10px] px-3.5 py-3">
                  <CircleAlert className="size-4.5" aria-hidden />
                  <AlertDescription className="text-sm leading-[1.55]">{summary}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5">
                    <FormLabel className="font-semibold">Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Short summary the customer will see"
                        className="min-h-11 md:min-h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesterCustomerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5">
                    <FormLabel className="font-semibold">Requester</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="min-h-11 md:min-h-10">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No customers yet
                          </SelectItem>
                        ) : null}
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {/* The design labels options "name · company". Email is the
                                fallback so a customer with no company on file is still
                                distinguishable from a namesake. */}
                            {customer.fullName} · {customer.company ?? customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5">
                    <FormLabel className="font-semibold">Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="min-h-11 md:min-h-10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1.5">
                    <FormLabel className="font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What happened, what you expect, and anything you've already tried."
                        className="min-h-33 text-sm"
                        {...field}
                      />
                    </FormControl>
                    {/* Required, not optional as the design's draft implies:
                        `tickets.description` is NOT NULL and this becomes both it and the
                        ticket's opening message. */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                {/* A label wrapping the input, so "browse" is the control rather than a
                    word next to one: click anywhere in the box, and the (visually hidden
                    but focusable) input keeps it reachable from the keyboard. */}
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-dashed border-input bg-background p-5 text-center transition-colors",
                    "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                    dragging && "border-brand-accent bg-brand-accent/5",
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files) addFiles(event.target.files);
                      // Clear it, or picking the same file twice in a row fires no change
                      // event and the user thinks the second attempt did nothing.
                      event.target.value = "";
                    }}
                  />
                  <Paperclip className="size-5 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">
                    Drop files or browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, PDF or LOG up to {formatBytes(ATTACHMENT_MAX_BYTES)}
                  </span>
                </label>

                {fileError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {fileError}
                  </p>
                ) : null}

                {/* The design only draws the empty dropzone. A picker that shows nothing
                    back once files are chosen is unusable, so this state is additive. */}
                {files.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pr-1.5 pl-2.5"
                      >
                        <Paperclip
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => removeFile(index)}
                        >
                          <X aria-hidden />
                          <span className="sr-only">Remove {file.name}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <SheetFooter className="flex-row flex-wrap justify-end gap-2.5 border-t p-4">
              <Button
                type="button"
                variant="neutral"
                className="min-h-11 md:min-h-10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="min-h-11 bg-brand-accent font-semibold text-brand-accent-foreground hover:bg-brand-accent/90 md:min-h-10"
              >
                {isPending ? "Creating…" : "Create ticket"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
