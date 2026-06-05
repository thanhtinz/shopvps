// Affiliate commission helpers.

/**
 * Create a PENDING referral commission for the buyer's referrer (if the buyer
 * was referred). Must be called inside a Prisma transaction — pass the `tx`
 * client. The commission stays PENDING until an admin approves it, at which
 * point the amount is credited to the referrer's affiliate balance.
 */
export async function recordReferralCommission(
  tx: any,
  buyerUserId: string,
  orderId: string,
  orderType: "vps" | "hosting",
  orderAmount: number
): Promise<void> {
  if (!orderAmount || orderAmount <= 0) return;

  const referral = await tx.affiliateReferral.findFirst({ where: { referredId: buyerUserId } });
  if (!referral) return;

  const amount = Math.floor(orderAmount * Number(referral.commissionRate) / 100);
  if (amount <= 0) return;

  await tx.commission.create({
    data: {
      userId: referral.referrerId,
      orderId,
      orderType,
      amount,
      status: "PENDING",
    },
  });
}
