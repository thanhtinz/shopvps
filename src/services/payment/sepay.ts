import crypto from "crypto";
import { prisma } from "@/lib/db";

export interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string | null;
  content: string;
  transferType: "in" | "out";
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
  description: string;
}

export function verifySepaySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return hmac === signature;
}

/**
 * Generate payment content for user to transfer
 * Format: SHOPVPS {userId} — SePay auto-matches by content
 */
export function generatePaymentContent(userId: string): string {
  return `SHOPVPS ${userId.slice(-8).toUpperCase()}`;
}

/**
 * Process incoming SePay webhook
 */
export async function processSepayWebhook(payload: SepayWebhookPayload): Promise<{
  success: boolean;
  message: string;
  userId?: string;
}> {
  if (payload.transferType !== "in") {
    return { success: false, message: "Not an incoming transfer" };
  }

  // Extract user ID from content
  const match = payload.content?.match(/SHOPVPS\s+([A-Z0-9]{8})/i);
  if (!match) {
    return { success: false, message: "Cannot identify user from content" };
  }

  const userSuffix = match[1].toLowerCase();
  const user = await prisma.user.findFirst({
    where: { id: { endsWith: userSuffix } },
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Check if transaction already processed
  const existing = await prisma.transaction.findUnique({
    where: { reference: String(payload.id) },
  });
  if (existing) {
    return { success: false, message: "Transaction already processed" };
  }

  const amount = payload.transferAmount;

  // Calculate bonus
  const bonus = await calculateDepositBonus(amount);
  const totalCredit = amount + bonus;

  // Create transaction & update wallet in one operation
  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore: user.walletBalance,
        balanceAfter: Number(user.walletBalance) + amount,
        status: "COMPLETED",
        reference: String(payload.id),
        description: `Nạp tiền qua SePay - ${payload.content}`,
        metadata: payload as any,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { walletBalance: { increment: totalCredit } },
    }),
    // Bonus transaction if applicable
    ...(bonus > 0 ? [prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BONUS",
        amount: bonus,
        balanceBefore: Number(user.walletBalance) + amount,
        balanceAfter: Number(user.walletBalance) + totalCredit,
        status: "COMPLETED",
        description: `Bonus nạp tiền: +${bonus.toLocaleString("vi-VN")}đ`,
      },
    })] : []),
  ]);

  // Send notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "PAYMENT",
      title: "Nạp tiền thành công",
      content: `Tài khoản của bạn đã được cộng ${amount.toLocaleString("vi-VN")}đ${bonus > 0 ? ` + ${bonus.toLocaleString("vi-VN")}đ bonus` : ""}.`,
    },
  });

  return { success: true, message: "Payment processed", userId: user.id };
}

async function calculateDepositBonus(amount: number): Promise<number> {
  const bonusTier = await prisma.depositBonus.findFirst({
    where: {
      isActive: true,
      minAmount: { lte: amount },
      OR: [
        { maxAmount: null },
        { maxAmount: { gte: amount } },
      ],
    },
    orderBy: { minAmount: "desc" },
  });

  if (!bonusTier) return 0;
  return Math.round(amount * (bonusTier.bonusPercent / 100));
}
