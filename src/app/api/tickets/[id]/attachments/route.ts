import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  formatBytes,
} from "@/features/tickets/lib/attachments";
import { TicketError, addAttachments } from "@/features/tickets/services/ticket.service";

/**
 * Attach files to a ticket.
 *
 * A route handler rather than the Server Action the rest of this feature uses, for one
 * reason: `serverActions.bodySizeLimit` is a single number for *every* action in the app.
 * Raising it to 20 MB so this one upload fits would also raise it for the login form and
 * every inline queue edit — the whole action surface would start accepting 20 MB bodies.
 * A route handler is not covered by that limit, so the large-body surface stays exactly
 * one endpoint wide. `connect-src 'self'` in the CSP (next.config.ts) allows the fetch;
 * a browser Supabase client uploading straight to Storage would not be allowed, which is
 * the other reason this goes through the server at all.
 *
 * Untrusted entry point. Everything below re-checks: this is reachable by POST without
 * going anywhere near the sheet.
 */

const ticketId = z.uuid();

/** The response the New ticket sheet reads. */
type UploadResponse = {
  uploaded: number;
  rejected: { filename: string; reason: string }[];
};

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/tickets/[id]/attachments">,
): Promise<Response> {
  /*
   * Server Actions get an Origin/Host comparison from Next.js for free; a route handler
   * does not, and this one mutates state on the strength of a session cookie. Same check,
   * done here. It is a second lock rather than the only one — the Supabase auth cookie is
   * SameSite=Lax, so a cross-site POST would not carry it either.
   */
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Bad origin." }, { status: 403 });
  }

  const parsedId = ticketId.safeParse((await context.params).id);

  if (!parsedId.success) {
    return Response.json({ message: "That isn't a ticket." }, { status: 400 });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    // The body was larger than the platform would accept, or wasn't multipart at all.
    return Response.json(
      { message: `Files must be under ${formatBytes(ATTACHMENT_MAX_BYTES)} each.` },
      { status: 413 },
    );
  }

  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return Response.json({ message: "Choose a file first." }, { status: 400 });
  }

  if (files.length > ATTACHMENT_MAX_FILES) {
    return Response.json(
      { message: `Attach up to ${ATTACHMENT_MAX_FILES} files at a time.` },
      { status: 400 },
    );
  }

  try {
    const result = await addAttachments(parsedId.data, files);

    // The sidebar on the ticket reads `attachments`, and the queue's row does not — so
    // only the detail route is invalidated here.
    revalidatePath(`/tickets/${parsedId.data}`);

    return Response.json(result satisfies UploadResponse, { status: 200 });
  } catch (error) {
    if (error instanceof TicketError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    console.error("[tickets] attachment upload failed", error);

    return Response.json(
      { message: "We couldn't attach those files. Try again in a moment." },
      { status: 500 },
    );
  }
}
