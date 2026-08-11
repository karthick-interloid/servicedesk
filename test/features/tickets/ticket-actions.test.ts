import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The actions are the trust boundary: they re-validate untrusted input and turn service
 * failures into copy a form can render. Both are worth pinning.
 *
 * The services are mocked wholesale — the real modules pull in `next/headers` and the
 * Supabase client, neither of which has a request context here — so `TicketError` is
 * re-declared. It stays in step because the actions only read `.code`/`.message` and
 * `instanceof` resolves against this same class.
 */

const createTicketMock = vi.fn();
const addMessageMock = vi.fn();
const updateTicketMock = vi.fn();
const importTicketsMock = vi.fn();
const previewImportMock = vi.fn();
const revalidatePathMock = vi.fn();

class TicketError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, { status = 400, code = "unknown" } = {}) {
    super(message);
    this.name = "TicketError";
    this.status = status;
    this.code = code;
  }
}

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

vi.mock("@/features/tickets/services/ticket.service", () => ({
  TicketError,
  createTicket: (...args: unknown[]) => createTicketMock(...args),
  addMessage: (...args: unknown[]) => addMessageMock(...args),
  updateTicket: (...args: unknown[]) => updateTicketMock(...args),
}));

vi.mock("@/features/tickets/services/csv-import", () => ({
  importTickets: (...args: unknown[]) => importTicketsMock(...args),
  previewImport: (...args: unknown[]) => previewImportMock(...args),
}));

const {
  addMessageAction,
  createTicketAction,
  importTicketsAction,
  previewImportAction,
  updateTicketAction,
} = await import("@/features/tickets/actions");

const CUSTOMER = "11111111-1111-4111-8111-111111111111";
const TICKET = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

const VALID_TICKET = {
  requesterCustomerId: CUSTOMER,
  subject: "Chat widget stuck",
  description: "It never connects.",
  priority: "urgent" as const,
  assigneeUserId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  createTicketMock.mockResolvedValue({ id: TICKET, number: 4823 });
  addMessageMock.mockResolvedValue({ id: "m-1" });
  updateTicketMock.mockResolvedValue(undefined);
  previewImportMock.mockResolvedValue({ ready: 3, skipped: [] });
  importTicketsMock.mockResolvedValue({ imported: 3, skipped: 1 });
});

describe("createTicketAction", () => {
  it("creates and returns the new ticket", async () => {
    await expect(createTicketAction(VALID_TICKET)).resolves.toEqual({
      success: true,
      data: { id: TICKET, number: 4823 },
    });
  });

  /* The queue is a Server Component read. Without this the redirect lands on a cached RSC
     payload and the user watches their own ticket fail to appear. */
  it("revalidates the queue so the new row shows up", async () => {
    await createTicketAction(VALID_TICKET);
    expect(revalidatePathMock).toHaveBeenCalledWith("/tickets");
  });

  it("rejects input the form would have caught, and says which fields", async () => {
    const result = await createTicketAction({ ...VALID_TICKET, subject: "" });

    expect(result).toMatchObject({ success: false, code: "validation" });
    expect(result.success === false && result.fieldErrors?.["subject"]).toBeTruthy();
    expect(createTicketMock).not.toHaveBeenCalled();
  });

  /* A Server Action is a public POST endpoint reachable without the UI, so a caller can
     send anything at all — including nothing. */
  it("rejects a non-object payload rather than throwing", async () => {
    await expect(createTicketAction("nope")).resolves.toMatchObject({ code: "validation" });
    await expect(createTicketAction(undefined)).resolves.toMatchObject({ code: "validation" });
  });

  it("rejects a requester id that is not a uuid", async () => {
    const result = await createTicketAction({ ...VALID_TICKET, requesterCustomerId: "1" });
    expect(result).toMatchObject({ success: false, code: "validation" });
  });

  it("requires a description — tickets.description is NOT NULL", async () => {
    const result = await createTicketAction({ ...VALID_TICKET, description: "   " });
    expect(result).toMatchObject({ success: false, code: "validation" });
  });

  it("passes a permission failure through to the user", async () => {
    createTicketMock.mockRejectedValue(
      new TicketError("You don't have permission to raise tickets here.", { code: "forbidden" }),
    );

    await expect(createTicketAction(VALID_TICKET)).resolves.toEqual({
      success: false,
      code: "forbidden",
      message: "You don't have permission to raise tickets here.",
    });
  });

  it("does not leak an unexpected failure's detail", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createTicketMock.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.4:5432"));

    const result = await createTicketAction(VALID_TICKET);

    expect(result).toMatchObject({ success: false, code: "unknown" });
    expect(JSON.stringify(result)).not.toContain("ECONNREFUSED");
  });
});

describe("addMessageAction", () => {
  const VALID_REPLY = { ticketId: TICKET, body: "On it.", visibility: "public" as const };

  it("posts a reply", async () => {
    await expect(addMessageAction(VALID_REPLY)).resolves.toEqual({
      success: true,
      data: { id: "m-1" },
    });
  });

  it("revalidates both the thread and the queue", async () => {
    await addMessageAction(VALID_REPLY);

    expect(revalidatePathMock).toHaveBeenCalledWith(`/tickets/${TICKET}`);
    expect(revalidatePathMock).toHaveBeenCalledWith("/tickets");
  });

  it("refuses an empty body", async () => {
    await expect(addMessageAction({ ...VALID_REPLY, body: "  " })).resolves.toMatchObject({
      code: "validation",
    });
    expect(addMessageMock).not.toHaveBeenCalled();
  });

  /* Visibility decides whether the customer portal ever sees the text, so it is a closed
     set that is never inferred from anything. */
  it("refuses a visibility outside the enum", async () => {
    await expect(addMessageAction({ ...VALID_REPLY, visibility: "secret" })).resolves.toMatchObject(
      { code: "validation" },
    );
  });

  it("carries an internal note through as internal", async () => {
    await addMessageAction({ ...VALID_REPLY, visibility: "internal" });

    expect(addMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "internal" }),
    );
  });
});

describe("updateTicketAction", () => {
  it("applies a single property change", async () => {
    await expect(updateTicketAction({ ticketId: TICKET, status: "resolved" })).resolves.toEqual({
      success: true,
      data: null,
    });
  });

  it("distinguishes clearing an assignee from leaving it alone", async () => {
    await updateTicketAction({ ticketId: TICKET, assigneeUserId: null });
    expect(updateTicketMock).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeUserId: null }),
    );

    updateTicketMock.mockClear();

    await updateTicketAction({ ticketId: TICKET, priority: "low" });
    expect(updateTicketMock.mock.calls[0]![0]).not.toHaveProperty("assigneeUserId");
  });

  it("accepts a real assignee", async () => {
    await expect(
      updateTicketAction({ ticketId: TICKET, assigneeUserId: USER }),
    ).resolves.toMatchObject({ success: true });
  });

  it("refuses a status outside public.ticket_status", async () => {
    await expect(
      updateTicketAction({ ticketId: TICKET, status: "on_fire" }),
    ).resolves.toMatchObject({ code: "validation" });
  });
});

describe("import actions", () => {
  it("refuses an empty file before reaching the service", async () => {
    await expect(previewImportAction("")).resolves.toMatchObject({ code: "validation" });
    await expect(importTicketsAction(undefined)).resolves.toMatchObject({ code: "validation" });

    expect(previewImportMock).not.toHaveBeenCalled();
    expect(importTicketsMock).not.toHaveBeenCalled();
  });

  it("previews without writing anything", async () => {
    const result = await previewImportAction("a,b\n1,2");

    expect(result).toMatchObject({ success: true });
    expect(importTicketsMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  /* The mapping arrives off the wire, so an entry that is not a known field name becomes a
     skipped column rather than being passed through to the query builder. */
  it("scrubs an unknown field name out of the mapping", async () => {
    await previewImportAction("a,b\n1,2", ["subject", "dropTable"]);
    expect(previewImportMock).toHaveBeenCalledWith("a,b\n1,2", ["subject", null]);
  });

  it("ignores a mapping that is not an array", async () => {
    await previewImportAction("a,b\n1,2", "subject");
    expect(previewImportMock).toHaveBeenCalledWith("a,b\n1,2", undefined);
  });

  it("revalidates the queue after a real import", async () => {
    await expect(importTicketsAction("a,b\n1,2")).resolves.toEqual({
      success: true,
      data: { imported: 3, skipped: 1 },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/tickets");
  });

  it("surfaces a validation failure from the service", async () => {
    importTicketsMock.mockRejectedValue(
      new TicketError("Map a Subject column and a Requester email column before importing.", {
        code: "validation",
      }),
    );

    await expect(importTicketsAction("a,b\n1,2")).resolves.toMatchObject({
      success: false,
      code: "validation",
    });
  });
});
