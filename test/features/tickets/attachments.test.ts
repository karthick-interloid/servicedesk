import { describe, expect, it } from "vitest";

import {
  ATTACHMENT_MAX_BYTES,
  attachmentExtension,
  attachmentMime,
  formatBytes,
  rejectAttachment,
} from "@/features/tickets/lib/attachments";

/**
 * These rules are enforced twice — in the New ticket sheet before a 20 MB POST is worth
 * making, and again inside `POST /api/tickets/[id]/attachments`, which is reachable without
 * the sheet. Both call the functions below, so this is the one place either can be wrong.
 */

describe("attachmentExtension", () => {
  it("accepts the five types the design's caption names", () => {
    expect(attachmentExtension("screenshot.png")).toBe("png");
    expect(attachmentExtension("photo.jpg")).toBe("jpg");
    expect(attachmentExtension("photo.jpeg")).toBe("jpeg");
    expect(attachmentExtension("invoice.pdf")).toBe("pdf");
    expect(attachmentExtension("server.log")).toBe("log");
  });

  it("is case-insensitive, because Windows hands over .PNG", () => {
    expect(attachmentExtension("Screenshot.PNG")).toBe("png");
  });

  it("reads the last extension, not the first", () => {
    expect(attachmentExtension("archive.pdf.exe")).toBeNull();
    expect(attachmentExtension("report.final.pdf")).toBe("pdf");
  });

  it("rejects anything else, including no extension at all", () => {
    expect(attachmentExtension("payload.svg")).toBeNull();
    expect(attachmentExtension("script.js")).toBeNull();
    expect(attachmentExtension("README")).toBeNull();
    expect(attachmentExtension("trailing.")).toBeNull();
    // A leading dot is the whole name, not an extension — `.log` is a dotfile.
    expect(attachmentExtension(".log")).toBeNull();
  });
});

describe("attachmentMime", () => {
  /* The stored MIME comes from the name, never from `File.type`, because the browser's
     value is client-supplied and a later download sets Content-Type from the row. */
  it("maps each accepted extension to a fixed type", () => {
    expect(attachmentMime("png")).toBe("image/png");
    expect(attachmentMime("jpg")).toBe("image/jpeg");
    expect(attachmentMime("jpeg")).toBe("image/jpeg");
    expect(attachmentMime("pdf")).toBe("application/pdf");
    expect(attachmentMime("log")).toBe("text/plain");
  });

  it("never invents a type for something outside the map", () => {
    expect(attachmentMime("svg")).toBe("application/octet-stream");
  });
});

describe("rejectAttachment", () => {
  it("passes a file that is the right type and within the limit", () => {
    expect(rejectAttachment({ name: "screenshot.png", size: 1024 })).toBeNull();
    expect(rejectAttachment({ name: "big.pdf", size: ATTACHMENT_MAX_BYTES })).toBeNull();
  });

  it("refuses a type the bucket shouldn't hold", () => {
    expect(rejectAttachment({ name: "payload.svg", size: 10 })).toMatch(/PNG, JPG, PDF or LOG/);
  });

  it("refuses one byte over the limit, and says the limit", () => {
    expect(rejectAttachment({ name: "big.pdf", size: ATTACHMENT_MAX_BYTES + 1 })).toBe(
      "That file is over 20 MB.",
    );
  });

  it("refuses an empty file, which uploads fine and stores nothing", () => {
    expect(rejectAttachment({ name: "empty.log", size: 0 })).toBe("That file is empty.");
  });

  it("checks the type before the size, so an oversized .exe is refused as a type", () => {
    expect(rejectAttachment({ name: "virus.exe", size: ATTACHMENT_MAX_BYTES * 2 })).toMatch(
      /PNG, JPG, PDF or LOG/,
    );
  });
});

describe("formatBytes", () => {
  it("renders the design's captions", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(49_152)).toBe("48 KB");
    expect(formatBytes(1_258_291)).toBe("1.2 MB");
  });

  it("keeps whole megabytes whole, so the dropzone reads '20 MB'", () => {
    expect(formatBytes(ATTACHMENT_MAX_BYTES)).toBe("20 MB");
  });
});
