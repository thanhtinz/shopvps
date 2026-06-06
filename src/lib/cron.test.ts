import { describe, it, expect } from "vitest";
import { isValidCron, cronMatches } from "./cron";

describe("isValidCron", () => {
  it("accepts valid 5-field expressions", () => {
    expect(isValidCron("* * * * *")).toBe(true);
    expect(isValidCron("*/5 * * * *")).toBe(true);
    expect(isValidCron("0 9 * * 1-5")).toBe(true);
    expect(isValidCron("30 0 1 1 *")).toBe(true);
  });
  it("rejects malformed expressions", () => {
    expect(isValidCron("* * * *")).toBe(false);     // 4 fields
    expect(isValidCron("60 * * * *")).toBe(false);   // minute out of range
    expect(isValidCron("* 24 * * *")).toBe(false);   // hour out of range
    expect(isValidCron("* * * * 9")).toBe(false);    // dow out of range
    expect(isValidCron("abc")).toBe(false);
  });
});

describe("cronMatches", () => {
  it("matches every-minute", () => {
    expect(cronMatches("* * * * *", new Date("2024-06-01T12:34:00"))).toBe(true);
  });
  it("matches a step minute", () => {
    expect(cronMatches("*/15 * * * *", new Date("2024-06-01T12:30:00"))).toBe(true);
    expect(cronMatches("*/15 * * * *", new Date("2024-06-01T12:31:00"))).toBe(false);
  });
  it("matches a specific time on weekdays", () => {
    // 2024-06-03 is a Monday
    expect(cronMatches("0 9 * * 1-5", new Date("2024-06-03T09:00:00"))).toBe(true);
    // 2024-06-02 is a Sunday
    expect(cronMatches("0 9 * * 1-5", new Date("2024-06-02T09:00:00"))).toBe(false);
  });
});
