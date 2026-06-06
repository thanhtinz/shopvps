import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

export const PAYOUT_METHODS = ["wallet", "bank", "paypal"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export interface PayoutConfig {
  minAmount: number;       // minimum a user may request
  autoEnabled: boolean;    // run automatic payouts at all
  autoThreshold: number;   // auto-pay once affiliate balance reaches this
}

function num(v: string | undefined, def: number): number {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) && n >= 0 ? n : def;
}

export async function getPayoutConfig(): Promise<PayoutConfig> {
  const s = await getSettings(["affiliate_min_payout", "affiliate_auto_payout", "affiliate_auto_payout_threshold"]);
  return {
    minAmount: num(s.affiliate_min_payout, 50000),
    autoEnabled: (s.affiliate_auto_payout ?? "false") === "true",
    autoThreshold: num(s.affiliate_auto_payout_threshold, 200000),
  };
}

export type PayoutReason = "INVALID_METHOD" | "INVALID_AMOUNT" | "MIN_NOT_MET" | "INSUFFICIENT_BALANCE" | "NEED_DESTINATION";
export interface PayoutResult { ok: boolean; reason?: PayoutReason; payoutId?: string; instant?: boolean }

/**
 * Request an affiliate payout. The affiliate balance is debited immediately
 * (reserved). "wallet" payouts settle instantly into the main balance; "bank"/
 * "paypal" payouts are created PENDING for an admin to mark paid (or reject,
 * which refunds the affiliate balance).
 */
export async function requestPayout(
  userId: string, amount: number, method: PayoutMethod, destination?: string, loc: Locale = "vi",
): Promise<PayoutResult> {
  if (!PAYOUT_METHODS.includes(method)) return { ok: false, reason: "INVALID_METHOD" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "INVALID_AMOUNT" };
  if (method !== "wallet" && !(destination && destination.trim())) return { ok: false, reason: "NEED_DESTINATION" };

  const cfg = await getPayoutConfig();
  if (amount < cfg.minAmount) return { ok: false, reason: "MIN_NOT_MET" };

  try {
    let payoutId = "";
    await prisma.$transaction(async (tx: any) => {
      const moved = await tx.user.updateMany({
        where: { id: userId, affiliateBalance: { gte: amount } },
        data: { affiliateBalance: { decrement: amount } },
      });
      if (moved.count === 0) throw new Error("INSUFFICIENT_BALANCE");

      const instant = method === "wallet";
      if (instant) {
        await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } });
        const fresh = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
        const balanceAfter = Number(fresh!.balance);
        await tx.transaction.create({
          data: {
            userId, type: "COMMISSION", amount,
            balanceBefore: balanceAfter - amount, balanceAfter,
            description: translate(loc, "Rút hoa hồng về ví chính"), status: "COMPLETED",
          },
        });
      }
      const payout = await tx.payout.create({
        data: {
          userId, amount, method, destination: destination?.trim() || null,
          status: instant ? "PAID" : "PENDING", processedAt: instant ? new Date() : null,
        },
      });
      payoutId = payout.id;
    });
    return { ok: true, payoutId, instant: method === "wallet" };
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return { ok: false, reason: "INSUFFICIENT_BALANCE" };
    throw e;
  }
}

export async function approvePayout(payoutId: string, adminNote?: string, loc: Locale = "vi"): Promise<boolean> {
  const updated = await prisma.payout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "PAID", processedAt: new Date(), adminNote: adminNote || null },
  });
  if (updated.count === 0) return false;
  const p = await prisma.payout.findUnique({ where: { id: payoutId }, select: { userId: true, amount: true } });
  if (p) await prisma.notification.create({
    data: { userId: p.userId, type: "SUCCESS", title: translate(loc, "Yêu cầu rút tiền đã được duyệt"), content: `${translate(loc, "Khoản rút")} ${Number(p.amount).toLocaleString("vi-VN")}đ ${translate(loc, "đã được thanh toán.")}` },
  });
  return true;
}

/** Reject a pending payout and refund the reserved amount to the affiliate balance. */
export async function rejectPayout(payoutId: string, adminNote?: string, loc: Locale = "vi"): Promise<boolean> {
  try {
    let ok = false;
    await prisma.$transaction(async (tx: any) => {
      const payout = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!payout || payout.status !== "PENDING") return;
      await tx.user.update({ where: { id: payout.userId }, data: { affiliateBalance: { increment: payout.amount } } });
      await tx.payout.update({ where: { id: payoutId }, data: { status: "REJECTED", processedAt: new Date(), adminNote: adminNote || null } });
      await tx.notification.create({
        data: { userId: payout.userId, type: "WARNING", title: translate(loc, "Yêu cầu rút tiền bị từ chối"), content: `${translate(loc, "Khoản rút")} ${Number(payout.amount).toLocaleString("vi-VN")}đ ${translate(loc, "đã được hoàn lại số dư hoa hồng.")}` },
      });
      ok = true;
    });
    return ok;
  } catch (e) { console.error("rejectPayout error:", e); return false; }
}

/**
 * Automatic payouts: when enabled, move each opted-in user's affiliate balance
 * to their main wallet once it reaches the threshold. Returns the count paid.
 */
export async function runAutoPayouts(): Promise<number> {
  const cfg = await getPayoutConfig();
  if (!cfg.autoEnabled || cfg.autoThreshold <= 0) return 0;

  const users = await prisma.user.findMany({
    where: { autoPayout: true, affiliateBalance: { gte: cfg.autoThreshold } },
    select: { id: true },
  });

  let paid = 0;
  for (const u of users) {
    try {
      await prisma.$transaction(async (tx: any) => {
        const fresh = await tx.user.findUnique({ where: { id: u.id }, select: { affiliateBalance: true, balance: true } });
        const amount = Number(fresh!.affiliateBalance);
        if (amount < cfg.autoThreshold) return; // changed since the scan
        const balanceAfter = Number(fresh!.balance) + amount;
        await tx.user.update({ where: { id: u.id }, data: { affiliateBalance: { decrement: amount }, balance: { increment: amount } } });
        await tx.transaction.create({
          data: {
            userId: u.id, type: "COMMISSION", amount,
            balanceBefore: balanceAfter - amount, balanceAfter,
            description: translate("vi", "Tự động rút hoa hồng về ví chính"), status: "COMPLETED",
          },
        });
        await tx.payout.create({ data: { userId: u.id, amount, method: "wallet", status: "PAID", auto: true, processedAt: new Date() } });
        const { t } = { t: (k: string) => translate("vi", k) };
        await tx.notification.create({ data: { userId: u.id, type: "SUCCESS", title: t("Đã tự động rút hoa hồng"), content: `${amount.toLocaleString("vi-VN")}đ ${t("đã được chuyển vào ví chính.")}` } });
      });
      paid++;
    } catch (e) { console.error(`[Auto Payout] failed for ${u.id}:`, e); }
  }
  return paid;
}
