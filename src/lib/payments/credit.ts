import { prisma } from "@/lib/prisma";

/**
 * Idempotently credit a previously-created PENDING deposit transaction once the
 * gateway confirms payment. Applies any matching deposit bonus and updates the
 * wallet balance atomically. Safe to call more than once (e.g. webhook retries).
 */
export async function creditPendingDeposit(reference: string): Promise<{ ok: boolean; reason?: string }> {
  return prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.findUnique({ where: { reference } });
    if (!txn) return { ok: false, reason: "not_found" };
    if (txn.type !== "DEPOSIT") return { ok: false, reason: "wrong_type" };
    if (txn.status === "COMPLETED") return { ok: true }; // already credited

    const amountBase = Number(txn.amount);

    // Compute deposit bonus (highest matching tier).
    const bonuses = await tx.depositBonus.findMany({ where: { isActive: true }, orderBy: { minAmount: "desc" } });
    let bonus = 0;
    for (const b of bonuses) {
      if (amountBase >= Number(b.minAmount) && (!b.maxAmount || amountBase <= Number(b.maxAmount))) {
        bonus = Math.floor(amountBase * (Number(b.bonusPercent) / 100));
        break;
      }
    }

    const updated = await tx.user.update({ where: { id: txn.userId }, data: { balance: { increment: amountBase + bonus } } });
    const balanceAfter = Number(updated.balance);

    await tx.transaction.update({
      where: { id: txn.id },
      data: { status: "COMPLETED", balanceBefore: balanceAfter - amountBase - bonus, balanceAfter },
    });

    if (bonus > 0) {
      await tx.transaction.create({
        data: {
          userId: txn.userId, type: "BONUS", amount: bonus,
          balanceBefore: balanceAfter - bonus, balanceAfter,
          description: `Thưởng nạp tiền (${txn.gateway || "gateway"})`, status: "COMPLETED",
        },
      });
    }

    await tx.notification.create({
      data: { userId: txn.userId, type: "SUCCESS", title: "Nạp tiền thành công", content: `Tài khoản đã được cộng ${(amountBase + bonus).toLocaleString("vi-VN")}đ.` },
    });

    return { ok: true };
  });
}
