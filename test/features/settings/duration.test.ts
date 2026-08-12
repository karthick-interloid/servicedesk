import { describe, expect, it } from "vitest";

import { formatDuration, parseDuration } from "@/features/settings/lib/duration";
import { MOCK_SLA_POLICIES } from "@/features/settings/lib/mock-sla";
import { BUSINESS_DAY_MINS, SLA_TARGETS } from "@/features/onboarding/lib/onboarding-data";

describe("parseDuration", () => {
  it("matches onboarding's own prose→minutes pairs exactly", () => {
    // The whole point of the shared constant: this editor must produce the same integers
    // `register.service.ts` already writes for the same strings.
    for (const target of SLA_TARGETS) {
      expect(parseDuration(target.firstReply)?.minutes, target.firstReply).toBe(
        target.firstReplyMins,
      );
      expect(parseDuration(target.resolve)?.minutes, target.resolve).toBe(target.resolveMins);
    }
  });

  it.each([
    ["15 minutes", 15, false],
    ["1 minute", 1, false],
    ["1 hour", 60, false],
    ["4 hours", 240, false],
    ["8 business hours", 480, true],
    ["1 business day", BUSINESS_DAY_MINS, true],
    ["2 business days", 2 * BUSINESS_DAY_MINS, true],
    ["3 days", 3 * 24 * 60, false],
  ])("parses %s", (raw, minutes, businessClock) => {
    const parsed = parseDuration(raw);
    expect(parsed?.minutes).toBe(minutes);
    expect(parsed?.businessClock).toBe(businessClock);
  });

  it("is case- and whitespace-tolerant", () => {
    expect(parseDuration("  4   BUSINESS   Hours ")?.minutes).toBe(240);
  });

  it.each([
    ["soon"],
    [""],
    ["15"],
    ["minutes"],
    ["0 hours"],
    ["-2 hours"],
    ["1.5 hours"],
    ["two hours"],
    ["4 weeks"],
    // A minute is a minute on either clock; the design never writes this.
    ["30 business minutes"],
  ])("rejects %s", (raw) => {
    expect(parseDuration(raw)).toBeNull();
  });

  it("distinguishes the two clocks even when the arithmetic agrees", () => {
    // Both are 480 minutes; only `businessClock` records which clock was meant. The schema
    // has nowhere to store that difference — see features/settings/types.ts.
    const plain = parseDuration("8 hours")!;
    const business = parseDuration("8 business hours")!;

    expect(plain.minutes).toBe(business.minutes);
    expect(plain.businessClock).toBe(false);
    expect(business.businessClock).toBe(true);
  });
});

describe("formatDuration", () => {
  it("round-trips every duration the mock policies ship", () => {
    for (const policy of MOCK_SLA_POLICIES) {
      for (const target of policy.targets) {
        for (const raw of [target.firstResponse, target.resolution]) {
          const parsed = parseDuration(raw);
          expect(parsed, `${policy.name} / ${target.label}: "${raw}"`).not.toBeNull();
          expect(formatDuration(parsed!)).toBe(raw);
        }
      }
    }
  });

  it("singularises", () => {
    expect(formatDuration({ value: 1, unit: "day", businessClock: true })).toBe("1 business day");
    expect(formatDuration({ value: 2, unit: "day", businessClock: true })).toBe("2 business days");
  });
});

describe("mock policies", () => {
  it("covers all four priorities on every policy, as the editor always shows four rows", () => {
    for (const policy of MOCK_SLA_POLICIES) {
      expect(
        policy.targets.map((t) => t.scope),
        policy.name,
      ).toEqual(["urgent", "high", "normal", "low"]);
    }
  });

  it("keeps resolution at or beyond first response, which is what the editor enforces", () => {
    for (const policy of MOCK_SLA_POLICIES) {
      for (const target of policy.targets) {
        const first = parseDuration(target.firstResponse)!;
        const resolution = parseDuration(target.resolution)!;
        expect(resolution.minutes, `${policy.name} / ${target.label}`).toBeGreaterThanOrEqual(
          first.minutes,
        );
      }
    }
  });

  it("reuses onboarding's priority labels and tones rather than a third set", () => {
    for (const policy of MOCK_SLA_POLICIES) {
      expect(policy.targets.map((t) => t.label)).toEqual(SLA_TARGETS.map((t) => t.priority));
      expect(policy.targets.map((t) => t.tone)).toEqual(SLA_TARGETS.map((t) => t.tone));
    }
  });
});
