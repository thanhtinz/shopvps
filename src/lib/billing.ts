import { prisma } from "@/lib/prisma";
import { getSettings, getTaxConfig, taxFromInclusive } from "@/lib/settings";
import { generateInvoiceNumber, CYCLE_MONTHS, nextExpiry } from "@/lib/utils";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

export { CYCLE_MONTHS, addMonths, nextExpiry } from "@/lib/utils";

export interface BillingConfig {
  invoiceLeadDays: number;   // generate renewal invoices this many days before expiry
  suspendGraceDays: number;  // suspend a service this many days after the invoice due date
  terminateDays: number;     // terminate this many days after the invoice due date
  autoPay: boolean;          // auto-pay renewal invoices from wallet for auto-renew services
}

function intSetting(v: string | undefined, def: number): number {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

export async function getBillingConfig(): Promise<BillingConfig> {
  const s = await getSettings([
    "billing_invoice_lead_days",
    "billing_suspend_grace_days",
    "billing_terminate_days",
    "billing_auto_pay",
  ]);
  return {
    invoiceLeadDays: intSetting(s.billing_invoice_lead_days, 7),
    suspendGraceDays: intSetting(s.billing_suspend_grace_days, 3),
    terminateDays: intSetting(s.billing_terminate_days, 15),
    autoPay: (s.billing_auto_pay ?? "true") !== "false",
  };
}

export type ServiceKind = "vps" | "hosting";

/** The existing UNPAID renewal invoice for an order, if one is already open. */
export async function getOpenRenewalInvoice(kind: ServiceKind, orderId: string) {
  return prisma.invoice.findFirst({
    where: {
      status: "UNPAID",
      items: kind === "vps" ? { some: { vpsOrderId: orderId } } : { some: { hostingOrderId: orderId } },
    },
    orderBy: { createdAt: "desc" },
  });
}

interface RenewableOrder {
  id: string;
  userId: string;
  billingCycle: string;
  price: any;
  expiresAt: Date | null;
}

/**
 * Create an UNPAID renewal invoice for a service. Idempotent at the caller
 * level via getOpenRenewalInvoice — this always creates a new invoice.
 */
export async function createRenewalInvoice(kind: ServiceKind, order: RenewableOrder, label: string) {
  const months = CYCLE_MONTHS[order.billingCycle] || 1;
  const subtotal = Number(order.price) * months;
  const { rate, label: taxLabel } = await getTaxConfig();
  const tax = taxFromInclusive(subtotal, rate);
  const total = subtotal; // prices are tax-inclusive (VN convention)

  return prisma.invoice.create({
    data: {
      userId: order.userId,
      invoiceNumber: generateInvoiceNumber(),
      subtotal,
      discount: 0,
      tax,
      total,
      status: "UNPAID",
      notes: taxLabel ? `${taxLabel}: ${rate}%` : null,
      dueDate: order.expiresAt ?? new Date(),
      items: {
        create: {
          description: label,
          quantity: 1,
          unitPrice: total,
          total,
          vpsOrderId: kind === "vps" ? order.id : null,
          hostingOrderId: kind === "hosting" ? order.id : null,
        },
      },
    },
    include: { items: true },
  });
}

export interface PayResult {
  ok: boolean;
  reason?: "NOT_FOUND" | "NOT_OWNER" | "ALREADY_PAID" | "INSUFFICIENT_BALANCE";
  reactivated?: { vps: string[]; hosting: string[] };
}

/**
 * Pay an invoice from the user's wallet, atomically. For renewal invoices this
 * also extends the linked services' expiry and marks them ACTIVE. Returns which
 * services were reactivated so the caller can lift any provider-side suspension.
 */
export async function payInvoiceFromWallet(invoiceId: string, userId: string): Promise<PayResult> {
  const reactivated = { vps: [] as string[], hosting: [] as string[] };
  try {
    await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.userId !== userId) throw new Error("NOT_OWNER");
      if (invoice.status !== "UNPAID") throw new Error("ALREADY_PAID");

      const amount = Number(invoice.total);
      const dec = await tx.user.updateMany({
        where: { id: userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT_BALANCE");

      const fresh = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);

      const txn = await tx.transaction.create({
        data: {
          userId, type: "PURCHASE", amount,
          balanceBefore: balanceAfter + amount, balanceAfter,
          description: `${translate("vi", "Thanh toán hoá đơn")} ${invoice.invoiceNumber}`,
          status: "COMPLETED", reference: invoice.invoiceNumber,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date(), transactionId: txn.id },
      });

      // Extend any services attached to this invoice (renewal invoices).
      const now = new Date();
      for (const item of invoice.items) {
        if (item.vpsOrderId) {
          const o = await tx.vpsOrder.findUnique({ where: { id: item.vpsOrderId }, select: { billingCycle: true, expiresAt: true, status: true } });
          if (o && o.status !== "TERMINATED") {
            const months = CYCLE_MONTHS[o.billingCycle] || 1;
            await tx.vpsOrder.update({ where: { id: item.vpsOrderId }, data: { expiresAt: nextExpiry(o.expiresAt, months, now), status: "ACTIVE" } });
            if (o.status === "SUSPENDED") reactivated.vps.push(item.vpsOrderId);
          }
        }
        if (item.hostingOrderId) {
          const o = await tx.hostingOrder.findUnique({ where: { id: item.hostingOrderId }, select: { billingCycle: true, expiresAt: true, status: true } });
          if (o && o.status !== "TERMINATED") {
            const months = CYCLE_MONTHS[o.billingCycle] || 1;
            await tx.hostingOrder.update({ where: { id: item.hostingOrderId }, data: { expiresAt: nextExpiry(o.expiresAt, months, now), status: "ACTIVE" } });
            if (o.status === "SUSPENDED") reactivated.hosting.push(item.hostingOrderId);
          }
        }
      }
    });
    return { ok: true, reactivated };
  } catch (e: any) {
    const reason = ["NOT_FOUND", "NOT_OWNER", "ALREADY_PAID", "INSUFFICIENT_BALANCE"].includes(e?.message)
      ? e.message : undefined;
    if (reason) return { ok: false, reason };
    throw e;
  }
}

export function tBilling(locale: Locale) {
  return (k: string) => translate(locale, k);
}
