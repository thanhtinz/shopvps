import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { queueEmail, renewQueue } from "./index";
import { getVpsProvider } from "@/lib/vps-providers";
import { getWHMClient } from "@/lib/whm";
import { decrypt } from "@/lib/encrypt";
import { getUserT } from "@/lib/i18n/server";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

export const renewWorker = new Worker("auto-renew", async (job: Job) => {
  const { orderId, type } = job.data;
  if (type === "vps") await renewVps(orderId);
  else if (type === "hosting") await renewHosting(orderId);
}, { connection: connection as any });

renewWorker.on("failed", (job, err) => {
  console.error(`[Renew Worker] Job ${job?.id} failed:`, err.message);
});

/**
 * Atomically charge the user and extend the order's expiry inside one
 * transaction. Returns false if the balance is insufficient (no charge made).
 */
async function chargeAndExtend(
  kind: "vps" | "hosting",
  orderId: string,
  userId: string,
  price: number,
  currentExpiry: Date | null,
  months: number,
  description: string
): Promise<{ ok: boolean; newExpiry?: Date }> {
  try {
    let newExpiry: Date = new Date();
    await prisma.$transaction(async (tx: any) => {
      const dec = await tx.user.updateMany({
        where: { id: userId, balance: { gte: price } },
        data: { balance: { decrement: price } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT_BALANCE");

      const fresh = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);

      // Extend from the current expiry if still in the future, else from now.
      const base = currentExpiry && currentExpiry > new Date() ? new Date(currentExpiry) : new Date();
      base.setMonth(base.getMonth() + months);
      newExpiry = base;

      if (kind === "vps") await tx.vpsOrder.update({ where: { id: orderId }, data: { expiresAt: base } });
      else await tx.hostingOrder.update({ where: { id: orderId }, data: { expiresAt: base } });

      await tx.transaction.create({
        data: {
          userId, type: "PURCHASE", amount: price,
          balanceBefore: balanceAfter + price, balanceAfter,
          description, status: "COMPLETED",
        },
      });
    });
    return { ok: true, newExpiry };
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return { ok: false };
    throw e;
  }
}

// Schedule the next renewal cycle (unique jobId so it doesn't collide with the
// just-completed one).
async function scheduleNext(orderId: string, type: "vps" | "hosting", renewAt: Date) {
  const delay = Math.max(0, renewAt.getTime() - Date.now());
  await renewQueue.add("renew", { orderId, type }, { delay, jobId: `renew-${type}-${orderId}-${renewAt.getTime()}` });
}

async function renewVps(orderId: string) {
  const order = await prisma.vpsOrder.findUnique({ where: { id: orderId }, include: { user: true, provider: true } });
  if (!order || order.status === "TERMINATED" || !order.autoRenew) return;

  const months = CYCLE_MONTHS[order.billingCycle] || 1;
  const price = Number(order.price) * months;
  const { t } = await getUserT(order.userId);

  const res = await chargeAndExtend("vps", orderId, order.userId, price, order.expiresAt, months, `${t("Gia hạn VPS")} ${order.hostname}`);

  if (res.ok) {
    await prisma.notification.create({ data: { userId: order.userId, type: "VPS", title: t("VPS đã gia hạn"), content: `VPS ${order.hostname} ${t("đã được gia hạn")} ${months} ${t("tháng.")}` } });
    if (res.newExpiry) await scheduleNext(orderId, "vps", res.newExpiry);
  } else {
    // Insufficient balance → suspend the VPS at the provider and in the DB.
    await prisma.vpsOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
    try {
      if (order.provider.apiKey && order.providerVpsId) {
        const provider = getVpsProvider(order.provider.slug, decrypt(order.provider.apiKey));
        await provider.powerOff(order.providerVpsId);
      }
    } catch (e) { console.error(`[Renew Worker] VPS suspend failed for ${orderId}:`, e); }
    await prisma.notification.create({ data: { userId: order.userId, type: "VPS", title: t("VPS bị tạm dừng"), content: `VPS ${order.hostname} ${t("đã bị tạm dừng do không đủ số dư để gia hạn.")}` } });
    if (order.user?.email) await queueEmail(order.user.email, t("VPS bị tạm dừng"), `<p>VPS <strong>${order.hostname}</strong> ${t("đã bị tạm dừng do không đủ số dư. Vui lòng nạp tiền và liên hệ hỗ trợ để kích hoạt lại.")}</p>`);
  }
}

async function renewHosting(orderId: string) {
  const order = await prisma.hostingOrder.findUnique({ where: { id: orderId }, include: { user: true, server: true } });
  if (!order || order.status === "TERMINATED" || !order.autoRenew) return;

  const months = CYCLE_MONTHS[order.billingCycle] || 1;
  const price = Number(order.price) * months;
  const { t } = await getUserT(order.userId);

  const res = await chargeAndExtend("hosting", orderId, order.userId, price, order.expiresAt, months, `${t("Gia hạn Hosting")} ${order.domain}`);

  if (res.ok) {
    await prisma.notification.create({ data: { userId: order.userId, type: "HOSTING", title: t("Hosting đã gia hạn"), content: `Hosting ${order.domain} ${t("đã được gia hạn")} ${months} ${t("tháng.")}` } });
    if (res.newExpiry) await scheduleNext(orderId, "hosting", res.newExpiry);
  } else {
    // Insufficient balance → suspend the cPanel account.
    await prisma.hostingOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
    try {
      if (order.cpanelUsername) {
        const whm = getWHMClient(order.server);
        await whm.suspendAccount(order.cpanelUsername, t("Không đủ số dư gia hạn"));
      }
    } catch (e) { console.error(`[Renew Worker] Hosting suspend failed for ${orderId}:`, e); }
    await prisma.notification.create({ data: { userId: order.userId, type: "HOSTING", title: t("Hosting bị tạm dừng"), content: `Hosting ${order.domain} ${t("đã bị tạm dừng do không đủ số dư để gia hạn.")}` } });
    if (order.user?.email) await queueEmail(order.user.email, t("Hosting bị tạm dừng"), `<p>Hosting <strong>${order.domain}</strong> ${t("đã bị tạm dừng do không đủ số dư. Vui lòng nạp tiền và liên hệ hỗ trợ để kích hoạt lại.")}</p>`);
  }
}
