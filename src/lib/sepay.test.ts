import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifySePayWebhook, parseDepositReference, generateVietQRUrl } from "./sepay";

const secret = "webhook-secret";
const sign = (body: string, s = secret) =>
  crypto.createHmac("sha256", s).update(body).digest("hex");

describe("verifySePayWebhook", () => {
  const body = JSON.stringify({ transferAmount: 100000, content: "SHOPVPS abc" });

  it("accepts a correctly signed payload", () => {
    expect(verifySePayWebhook(body, sign(body), secret)).toBe(true);
  });

  it("rejects a wrong signature", () => {
    expect(verifySePayWebhook(body, sign(body, "other"), secret)).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifySePayWebhook(body, "", secret)).toBe(false);
  });

  it("rejects when the body is altered after signing", () => {
    const sig = sign(body);
    expect(verifySePayWebhook(body + " ", sig, secret)).toBe(false);
  });

  it("does not throw on a length-mismatched signature", () => {
    expect(() => verifySePayWebhook(body, "abc", secret)).not.toThrow();
    expect(verifySePayWebhook(body, "abc", secret)).toBe(false);
  });
});

describe("parseDepositReference", () => {
  it("extracts the user id from the transfer content", () => {
    expect(parseDepositReference("SHOPVPS clx123abc")).toBe("clx123abc");
  });

  it("is case-insensitive on the prefix", () => {
    expect(parseDepositReference("shopvps USER42")).toBe("USER42");
  });

  it("returns null when no reference is present", () => {
    expect(parseDepositReference("random bank memo")).toBeNull();
  });
});

describe("generateVietQRUrl", () => {
  it("builds a vietqr url and encodes the description", () => {
    const url = generateVietQRUrl({
      bankCode: "VCB", accountNumber: "123", accountName: "Shop VPS",
      amount: 50000, description: "SHOPVPS user 1",
    });
    expect(url).toContain("https://img.vietqr.io/image/VCB-123-compact2.png");
    expect(url).toContain("amount=50000");
    expect(url).toContain("addInfo=SHOPVPS%20user%201");
  });
});
