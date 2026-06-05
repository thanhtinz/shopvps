import { describe, it, expect } from "vitest";
import { pick, generateInvoiceNumber, generateAffiliateCode, getBillingCycleLabel, addMonths, nextExpiry, CYCLE_MONTHS, proratedDifference } from "./utils";

describe("pick (mass-assignment guard)", () => {
  it("keeps only whitelisted keys", () => {
    const body = { name: "Pro", price: 100, isActive: false, id: "hack", createdAt: "x" };
    expect(pick(body, ["name", "price"])).toEqual({ name: "Pro", price: 100 });
  });

  it("drops keys not present and ignores undefined values", () => {
    expect(pick({ name: "A", price: undefined }, ["name", "price", "slug"])).toEqual({ name: "A" });
  });

  it("returns an empty object for null/non-object input", () => {
    expect(pick(null, ["a"])).toEqual({});
    expect(pick(undefined, ["a"])).toEqual({});
  });

  it("does not let the body inject extra fields", () => {
    const out = pick({ name: "x", role: "SUPER_ADMIN" }, ["name"]);
    expect(out).not.toHaveProperty("role");
  });
});

describe("generateInvoiceNumber", () => {
  it("matches INV-YYYYMM-##### format", () => {
    expect(generateInvoiceNumber()).toMatch(/^INV-\d{6}-\d{5}$/);
  });
});

describe("generateAffiliateCode", () => {
  it("returns an uppercase alphanumeric code of the requested length", () => {
    expect(generateAffiliateCode(8)).toMatch(/^[A-Z0-9]{8}$/);
    expect(generateAffiliateCode(12)).toHaveLength(12);
  });
});

describe("getBillingCycleLabel", () => {
  it("maps known cycles to Vietnamese labels", () => {
    expect(getBillingCycleLabel("MONTHLY")).toBe("1 tháng");
    expect(getBillingCycleLabel("ANNUAL")).toBe("1 năm");
  });
  it("falls back to the raw value for unknown cycles", () => {
    expect(getBillingCycleLabel("WEEKLY")).toBe("WEEKLY");
  });
});

describe("billing date helpers", () => {
  it("addMonths advances the month without mutating the input", () => {
    const base = new Date("2024-01-15T00:00:00Z");
    const out = addMonths(base, 3);
    expect(out.getMonth()).toBe((base.getMonth() + 3) % 12);
    expect(base.toISOString()).toBe("2024-01-15T00:00:00.000Z"); // unchanged
  });

  it("CYCLE_MONTHS maps each billing cycle", () => {
    expect(CYCLE_MONTHS.MONTHLY).toBe(1);
    expect(CYCLE_MONTHS.QUARTERLY).toBe(3);
    expect(CYCLE_MONTHS.SEMI_ANNUAL).toBe(6);
    expect(CYCLE_MONTHS.ANNUAL).toBe(12);
  });

  it("nextExpiry extends from a future expiry (stacking), not from now", () => {
    const now = new Date("2024-06-01T00:00:00Z");
    const future = new Date("2024-06-20T00:00:00Z");
    expect(nextExpiry(future, 1, now).toISOString()).toBe("2024-07-20T00:00:00.000Z");
  });

  it("nextExpiry extends from now when already expired", () => {
    const now = new Date("2024-06-01T00:00:00Z");
    const past = new Date("2024-05-01T00:00:00Z");
    expect(nextExpiry(past, 1, now).toISOString()).toBe("2024-07-01T00:00:00.000Z");
  });
});

describe("proratedDifference (plan upgrade/downgrade)", () => {
  const now = new Date("2024-06-01T00:00:00Z");
  it("charges the full diff when a whole month remains", () => {
    const expiresAt = new Date("2024-07-01T00:00:00Z"); // 30 days
    expect(proratedDifference({ oldMonthly: 100, newMonthly: 200, months: 1, expiresAt, now })).toBe(100);
  });
  it("prorates by remaining half-term on upgrade", () => {
    const expiresAt = new Date("2024-06-16T00:00:00Z"); // 15 of 30 days
    expect(proratedDifference({ oldMonthly: 100, newMonthly: 200, months: 1, expiresAt, now })).toBe(50);
  });
  it("returns a negative amount for downgrades (no charge)", () => {
    const expiresAt = new Date("2024-07-01T00:00:00Z");
    expect(proratedDifference({ oldMonthly: 200, newMonthly: 100, months: 1, expiresAt, now })).toBe(-100);
  });
  it("returns 0 when the term has already expired", () => {
    const expiresAt = new Date("2024-05-01T00:00:00Z");
    expect(proratedDifference({ oldMonthly: 100, newMonthly: 300, months: 1, expiresAt, now })).toBe(0);
  });
});
