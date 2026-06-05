import { describe, it, expect, vi } from "vitest";
import { recordReferralCommission } from "./affiliate";

function makeTx(referral: any) {
  const create = vi.fn();
  const tx = {
    affiliateReferral: { findFirst: vi.fn().mockResolvedValue(referral) },
    commission: { create },
  };
  return { tx, create };
}

describe("recordReferralCommission", () => {
  it("creates a PENDING commission = floor(amount * rate%)", async () => {
    const { tx, create } = makeTx({ referrerId: "ref1", commissionRate: 10 });
    await recordReferralCommission(tx, "buyer", "order1", "vps", 199000);
    expect(create).toHaveBeenCalledWith({
      data: { userId: "ref1", orderId: "order1", orderType: "vps", amount: 19900, status: "PENDING" },
    });
  });

  it("does nothing when the buyer has no referrer", async () => {
    const { tx, create } = makeTx(null);
    await recordReferralCommission(tx, "buyer", "o", "vps", 100000);
    expect(create).not.toHaveBeenCalled();
  });

  it("skips zero or negative order amounts", async () => {
    const { tx, create } = makeTx({ referrerId: "r", commissionRate: 10 });
    await recordReferralCommission(tx, "b", "o", "hosting", 0);
    expect(create).not.toHaveBeenCalled();
  });

  it("skips when the computed commission rounds down to 0", async () => {
    const { tx, create } = makeTx({ referrerId: "r", commissionRate: 0 });
    await recordReferralCommission(tx, "b", "o", "vps", 100000);
    expect(create).not.toHaveBeenCalled();
  });
});
