import { Worker, Queue, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "./index";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getUserT } from "@/lib/i18n/server";
import {
  getBillingConfig, getOpenRenewalInvoice, createRenewalInvoice,
  payInvoiceFromWallet, CYCLE_MONTHS,
} from "@/lib/billing";
import {
  reactivateServices, suspendVpsAtProvider, suspendHostingAtProvider,
  terminateVpsAtProvider, terminateHostingAtProvider,
} from "@/lib/billing-provider";
import { runAutoPayouts } from "@/lib/payouts";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };
const DAY = 86400000;

export const billingQueue = new Queue("billing", { connection } as any);

export const billingWorker = new Worker("billing", async (_job: Job) => {
  await runBillingCycle();
}, { connection: connection as any });

billingWorker.on("failed", (job, err) => {
  console.error(`[Billing Worker] Job ${job?.id} failed:`, err.message);
});

// Recurring scan every 6h plus one shortly after startup.
billingQueue.add("cycle", {}, { repeat: { every: 6 * 60 * 60 * 1000 } }).catch(() => {});
billingQueue.add("cycle-initial", {}, { delay: 45_000 }).catch(() => {});

export async function runBillingCycle() {
  const cfg = await getBillingConfig();
  await generateUpcomingInvoices(cfg.invoiceLeadDays);
  if (cfg.autoPay) await autoPayDueInvoices();
  await runDunning(cfg.suspendGraceDays, cfg.terminateDays);
  const payouts = await runAutoPayouts();
  if (payouts) console.log(`[Billing Worker] Auto-paid ${payouts} affiliate payouts`);
}

/** Create UNPAID renewal invoices for services nearing expiry. */
async function generateUpcomingInvoices(leadDays: number) {
  const cutoff = new Date(Date.now() + leadDays * DAY);
  let created = 0;

  const vps = await prisma.vpsOrder.findMany({
    where: { status: { in: ["ACTIVE", "SUSPENDED"] }, expiresAt: { not: null, lte: cutoff } },
    include: { user: { select: { email: true, locale: true } }, package: { select: { name: true } } },
  });
  for (const o of vps) {
    if (await getOpenRenewalInvoice("vps", o.id)) continue;
    const { t } = await getUserT(o.userId);
    const label = `${t("Gia hạn VPS")} ${o.hostname} - ${o.package?.name || ""}`.trim();
    const inv = await createRenewalInvoice("vps", o as any, label);
    created++;
    await notifyInvoiceGenerated(o.userId, o.user?.email || null, inv, `VPS ${o.hostname}`);
  }

  const hosting = await prisma.hostingOrder.findMany({
    where: { status: { in: ["ACTIVE", "SUSPENDED"] }, expiresAt: { not: null, lte: cutoff } },
    include: { user: { select: { email: true, locale: true } }, package: { select: { name: true } } },
  });
  for (const o of hosting) {
    if (await getOpenRenewalInvoice("hosting", o.id)) continue;
    const { t } = await getUserT(o.userId);
    const label = `${t("Gia hạn Hosting")} ${o.domain} - ${o.package?.name || ""}`.trim();
    const inv = await createRenewalInvoice("hosting", o as any, label);
    created++;
    await notifyInvoiceGenerated(o.userId, o.user?.email || null, inv, `Hosting ${o.domain}`);
  }

  const products = await prisma.productOrder.findMany({
    where: { status: { in: ["ACTIVE", "SUSPENDED"] }, expiresAt: { not: null, lte: cutoff } },
    include: { user: { select: { email: true } }, product: { select: { name: true } } },
  });
  for (const o of products) {
    if (await getOpenRenewalInvoice("product", o.id)) continue;
    const { t } = await getUserT(o.userId);
    const label = `${t("Gia hạn")} ${o.product?.name || ""} — ${o.label}`.trim();
    const inv = await createRenewalInvoice("product", o as any, label);
    created++;
    await notifyInvoiceGenerated(o.userId, o.user?.email || null, inv, `${o.product?.name || ""} ${o.label}`.trim());
  }

  if (created) console.log(`[Billing Worker] Generated ${created} renewal invoices`);
}

/** Auto-pay open renewal invoices from the wallet for auto-renew services. */
async function autoPayDueInvoices() {
  const invoices = await prisma.invoice.findMany({
    where: { status: "UNPAID", items: { some: { OR: [{ vpsOrderId: { not: null } }, { hostingOrderId: { not: null } }, { productOrderId: { not: null } }] } } },
    include: { items: true },
  });

  let paid = 0;
  for (const inv of invoices) {
    if (!(await isAutoRenew(inv.items))) continue;
    const res = await payInvoiceFromWallet(inv.id, inv.userId);
    if (res.ok) {
      paid++;
      if (res.reactivated) await reactivateServices(res.reactivated);
      const { t } = await getUserT(inv.userId);
      await prisma.notification.create({
        data: {
          userId: inv.userId, type: "INFO",
          title: t("Đã gia hạn dịch vụ"),
          content: `${t("Hoá đơn")} ${inv.invoiceNumber} ${t("đã được thanh toán tự động từ ví.")}`,
        },
      });
    }
  }
  if (paid) console.log(`[Billing Worker] Auto-paid ${paid} renewal invoices`);
}

/** Suspend then terminate services whose renewal invoice stays unpaid. */
async function runDunning(suspendGraceDays: number, terminateDays: number) {
  const now = Date.now();
  const invoices = await prisma.invoice.findMany({
    where: { status: "UNPAID", dueDate: { not: null }, items: { some: { OR: [{ vpsOrderId: { not: null } }, { hostingOrderId: { not: null } }, { productOrderId: { not: null } }] } } },
    include: { items: true },
  });

  for (const inv of invoices) {
    const overdueDays = (now - new Date(inv.dueDate!).getTime()) / DAY;
    if (overdueDays < suspendGraceDays) continue;
    const terminate = overdueDays >= terminateDays;
    const { t } = await getUserT(inv.userId);

    for (const item of inv.items) {
      if (item.vpsOrderId) await dunVps(item.vpsOrderId, terminate, t);
      if (item.hostingOrderId) await dunHosting(item.hostingOrderId, terminate, t);
      if (item.productOrderId) await dunProduct(item.productOrderId, terminate, t);
    }

    if (terminate) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: "CANCELLED" } });
    }
  }
}

async function dunVps(orderId: string, terminate: boolean, t: (k: string) => string) {
  const o = await prisma.vpsOrder.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } } } });
  if (!o || o.status === "TERMINATED") return;
  if (terminate) {
    await terminateVpsAtProvider(orderId);
    await prisma.vpsOrder.update({ where: { id: orderId }, data: { status: "TERMINATED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, `VPS ${o.hostname}`, true);
  } else if (o.status === "ACTIVE") {
    await suspendVpsAtProvider(orderId);
    await prisma.vpsOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, `VPS ${o.hostname}`, false);
  }
}

async function dunHosting(orderId: string, terminate: boolean, t: (k: string) => string) {
  const o = await prisma.hostingOrder.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } } } });
  if (!o || o.status === "TERMINATED") return;
  if (terminate) {
    await terminateHostingAtProvider(orderId);
    await prisma.hostingOrder.update({ where: { id: orderId }, data: { status: "TERMINATED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, `Hosting ${o.domain}`, true);
  } else if (o.status === "ACTIVE") {
    await suspendHostingAtProvider(orderId, t("Hoá đơn chưa thanh toán"));
    await prisma.hostingOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, `Hosting ${o.domain}`, false);
  }
}

async function dunProduct(orderId: string, terminate: boolean, t: (k: string) => string) {
  const o = await prisma.productOrder.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } }, product: { select: { name: true } } } });
  if (!o || o.status === "TERMINATED") return;
  const label = `${o.product?.name || ""} ${o.label}`.trim();
  if (terminate) {
    await prisma.productOrder.update({ where: { id: orderId }, data: { status: "TERMINATED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, label, true);
  } else if (o.status === "ACTIVE") {
    await prisma.productOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
    await notifyDunning(o.userId, o.user?.email || null, t, label, false);
  }
}

async function isAutoRenew(items: any[]): Promise<boolean> {
  for (const it of items) {
    if (it.vpsOrderId) {
      const o = await prisma.vpsOrder.findUnique({ where: { id: it.vpsOrderId }, select: { autoRenew: true } });
      if (o?.autoRenew) return true;
    }
    if (it.hostingOrderId) {
      const o = await prisma.hostingOrder.findUnique({ where: { id: it.hostingOrderId }, select: { autoRenew: true } });
      if (o?.autoRenew) return true;
    }
    if (it.productOrderId) {
      const o = await prisma.productOrder.findUnique({ where: { id: it.productOrderId }, select: { autoRenew: true } });
      if (o?.autoRenew) return true;
    }
  }
  return false;
}

async function notifyInvoiceGenerated(userId: string, email: string | null, inv: any, service: string) {
  const { t } = await getUserT(userId);
  const due = inv.dueDate ? formatDate(inv.dueDate) : "";
  await prisma.notification.create({
    data: {
      userId, type: "INFO",
      title: t("Hoá đơn gia hạn mới"),
      content: `${t("Hoá đơn")} ${inv.invoiceNumber} — ${service} — ${formatCurrency(Number(inv.total))}. ${t("Hạn thanh toán:")} ${due}`,
    },
  });
  if (email) {
    await queueEmail(email, `${t("Hoá đơn gia hạn")} ${inv.invoiceNumber} - ShopVPS`,
      `<p>${t("Xin chào")},</p>
       <p>${t("Bạn có hoá đơn gia hạn mới cho")} <b>${service}</b>.</p>
       <p>${t("Số tiền")}: <b>${formatCurrency(Number(inv.total))}</b> — ${t("Hạn thanh toán:")} <b>${due}</b>.</p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/invoices">${t("Thanh toán hoá đơn")}</a></p>`);
  }
}

async function notifyDunning(userId: string, email: string | null, t: (k: string) => string, service: string, terminated: boolean) {
  const title = terminated ? t("Dịch vụ đã bị huỷ") : t("Dịch vụ bị tạm dừng");
  const body = terminated
    ? t("đã bị huỷ do hoá đơn gia hạn không được thanh toán.")
    : t("đã bị tạm dừng do hoá đơn gia hạn quá hạn. Vui lòng thanh toán để khôi phục.");
  await prisma.notification.create({
    data: { userId, type: "WARNING", title, content: `${service} ${body}` },
  });
  if (email) await queueEmail(email, `${title} - ShopVPS`, `<p><b>${service}</b> ${body}</p>`);
}
