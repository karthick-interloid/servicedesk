/**
 * What a ticket attachment is allowed to be.
 *
 * Imported by both sides on purpose. The browser copy is a courtesy — it stops a 20 MB
 * POST that was always going to be refused — and the copy inside
 * `POST /api/tickets/[id]/attachments` is the real check, because that endpoint is
 * reachable without going near this UI.
 */

/** The design's caption is "PNG, JPG, PDF or LOG up to 20 MB", and this is the "20 MB". */
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Files per ticket, per upload. The `ticket-attachments` bucket caps a single object at
 * 50 MB, but nothing caps the count, and one request is one `POST` we have to hold in
 * memory — so the batch is bounded here rather than left to whatever the file picker returns.
 */
export const ATTACHMENT_MAX_FILES = 10;

/**
 * Extension → the MIME we store.
 *
 * Derived from the name rather than taken from `File.type`: the browser's value is
 * client-supplied, and the row it lands in is what a later download will set
 * `Content-Type` from. A closed map means an upload can only ever be labelled as one of
 * the five things the design says it accepts.
 */
const ALLOWED_TYPES = new Map<string, string>([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["pdf", "application/pdf"],
  ["log", "text/plain"],
]);

/** For the file input's `accept`. Extensions, not MIMEs — `.log` has no reliable type. */
export const ATTACHMENT_ACCEPT = ".png,.jpg,.jpeg,.pdf,.log";

/** The lowercased extension, or null when there isn't one we recognise. */
export function attachmentExtension(filename: string): string | null {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return null;

  const ext = filename.slice(dot + 1).toLowerCase();

  return ALLOWED_TYPES.has(ext) ? ext : null;
}

/** The MIME we record for an extension `attachmentExtension` already vouched for. */
export function attachmentMime(extension: string): string {
  return ALLOWED_TYPES.get(extension) ?? "application/octet-stream";
}

/**
 * Why this file can't be attached, or null if it can.
 *
 * Returns the sentence the UI shows, so the browser and the server never disagree about
 * the wording of a refusal the user might see from either.
 */
export function rejectAttachment(file: { name: string; size: number }): string | null {
  if (!attachmentExtension(file.name)) {
    return "Only PNG, JPG, PDF or LOG files can be attached.";
  }

  if (file.size > ATTACHMENT_MAX_BYTES) {
    return `That file is over ${formatBytes(ATTACHMENT_MAX_BYTES)}.`;
  }

  // A zero-byte upload succeeds and stores nothing useful, so it is refused here rather
  // than left to look like a working attachment in the sidebar.
  if (file.size === 0) {
    return "That file is empty.";
  }

  return null;
}

/** "48 KB" / "1.2 MB" / "20 MB" — the design's own attachment captions. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  const mb = bytes / (1024 * 1024);

  // Whole values read as "20 MB", not "20.0 MB"; everything else keeps one decimal.
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}
