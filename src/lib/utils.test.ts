import { describe, it, expect } from "vitest";
import { pick, generateInvoiceNumber, generateAffiliateCode, getBillingCycleLabel } from "./utils";

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
