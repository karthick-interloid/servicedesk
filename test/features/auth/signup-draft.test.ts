import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSignupDraft,
  EMPTY_DRAFT,
  patchSignupDraft,
  readSignupDraft,
} from "@/features/auth/store/signup-draft";

/**
 * The draft is what makes "collect across three routes, submit once" possible, so the cases
 * that matter are the ones where it has to degrade rather than throw: absent, corrupt, from
 * an older build, or unwritable.
 */

describe("signup draft", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(readSignupDraft()).toEqual(EMPTY_DRAFT);
  });

  it("merges each step's values instead of replacing the draft", () => {
    patchSignupDraft({ fullName: "Ada Lovelace", email: "ada@acme.io" });
    patchSignupDraft({ organizationName: "Acme Support" });

    expect(readSignupDraft()).toMatchObject({
      fullName: "Ada Lovelace",
      email: "ada@acme.io",
      organizationName: "Acme Support",
    });
  });

  it("survives a corrupt entry by restarting the wizard, not throwing", () => {
    window.sessionStorage.setItem("sdp.signup.draft", "{not json");

    expect(() => readSignupDraft()).not.toThrow();
    expect(readSignupDraft()).toEqual(EMPTY_DRAFT);
  });

  it("fills in keys a draft from an older build is missing", () => {
    // Written before `fullName` existed — the field must come back as a string, not undefined.
    window.sessionStorage.setItem("sdp.signup.draft", JSON.stringify({ email: "ada@acme.io" }));

    const draft = readSignupDraft();
    expect(draft.email).toBe("ada@acme.io");
    expect(draft.fullName).toBe("");
    expect(draft.workingDays).toEqual(EMPTY_DRAFT.workingDays);
  });

  it("clears the draft, so the password stops living in storage", () => {
    patchSignupDraft({ password: "correct-horse" });
    expect(window.sessionStorage.getItem("sdp.signup.draft")).toContain("correct-horse");

    clearSignupDraft();

    expect(window.sessionStorage.getItem("sdp.signup.draft")).toBeNull();
    expect(readSignupDraft()).toEqual(EMPTY_DRAFT);
  });

  it("does not throw when storage is blocked, as in private mode", () => {
    const setItem = vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    // Returns the merged value so the current route still works; only persistence is lost.
    expect(patchSignupDraft({ email: "ada@acme.io" }).email).toBe("ada@acme.io");

    setItem.mockRestore();
  });
});
