import { prisma } from "@/lib/prisma";
import { CYCLE_MONTHS, proratedDifference, generateInvoiceNumber } from "@/lib/utils";
import { getTaxConfig, taxFromInclusive } from "@/lib/settings";
import { translate } from "@/lib/i18n/dictionaries";

export type ChangeReason =
  | "NOT_FOUND" | "INVALID_PACKAGE" | "SAME_PACKAGE" | "INSUFFICIENT_BALANCE" | "TERMINATED";

export interface ChangeResult {
  ok: boolean;
  reason?: ChangeReason;
  diff?: number;        // amount charged (>0 upgrade) or notional credit (<0 downgrade)
  packageName?: string;
}

/**
 * Switch a VPS/Hosting order to another package on the same provider/server.
 * Upgrades are charged from the wallet, prorated for the remaining term, and
 * recorded as a PAID invoice; downgrades apply immediately with no refund (the
 * lower price takes effect at the next renewal). The plan record is updated;
 * provider-side resizing, where unsupported by the API, is left to the admin.
 */
export async function changeServicePackage(
  kind: "vps" | "hosting", orderId: string, userId: string, newPackageId: string,
): Promise<ChangeResult> {
  try {
    let diff = 0;
    let packageName = "";
    await prisma.$transaction(async (tx: any) => {
      const order = kind === "vps"
        ? await tx.vpsOrder.findUnique({ where: { id: orderId } })
        : await tx.hostingOrder.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== userId) throw new Error("NOT_FOUND");
      if (order.status === "TERMINATED") throw new Error("TERMINATED");
      if (order.packageId === newPackageId) throw new Error("SAME_PACKAGE");

      const pkg = kind === "vps"
        ? await tx.vpsPackage.findUnique({ where: { id: newPackageId } })
        : await tx.hostingPackage.findUnique({ where: { id: newPackageId } });
      if (!pkg) throw new Error("INVALID_PACKAGE");
      if (kind === "vps" && pkg.providerId !== order.providerId) throw new Error("INVALID_PACKAGE");
      if (kind === "hosting" && pkg.serverId !== order.serverId) throw new Error("INVALID_PACKAGE");
      packageName = pkg.name;

      const months = CYCLE_MONTHS[order.billingCycle] || 1;
      diff = proratedDifference({
        oldMonthly: Number(order.price),
        newMonthly: Number(pkg.priceMonthly),
        months,
        expiresAt: order.expiresAt,
      });

      if (diff > 0) {
        const dec = await tx.user.updateMany({
          where: { id: userId, balance: { gte: diff } },
          data: { balance: { decrement: diff } },
        });
        if (dec.count === 0) throw new Error("INSUFFICIENT_BALANCE");
        const fresh = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
        const balanceAfter = Number(fresh!.balance);
        const invoiceNumber = generateInvoiceNumber();
        const { rate } = await getTaxConfig();
        const tax = taxFromInclusive(diff, rate);
        const txn = await tx.transaction.create({
          data: {
            userId, type: "PURCHASE", amount: diff,
            balanceBefore: balanceAfter + diff, balanceAfter,
            description: `${translate("vi", "Nâng cấp gói")} ${pkg.name}`,
            status: "COMPLETED", reference: invoiceNumber,
          },
        });
        await tx.invoice.create({
          data: {
            userId, transactionId: txn.id, invoiceNumber,
            subtotal: diff, discount: 0, tax, total: diff,
            status: "PAID", paidAt: new Date(),
            items: {
              create: {
                description: `${translate("vi", "Nâng cấp gói")} — ${pkg.name}`,
                quantity: 1, unitPrice: diff, total: diff,
                vpsOrderId: kind === "vps" ? orderId : null,
                hostingOrderId: kind === "hosting" ? orderId : null,
              },
            },
          },
        });
      }

      if (kind === "vps") await tx.vpsOrder.update({ where: { id: orderId }, data: { packageId: newPackageId, price: pkg.priceMonthly } });
      else await tx.hostingOrder.update({ where: { id: orderId }, data: { packageId: newPackageId, price: pkg.priceMonthly } });
    });
    return { ok: true, diff, packageName };
  } catch (e: any) {
    const reason: ChangeReason | undefined =
      ["NOT_FOUND", "INVALID_PACKAGE", "SAME_PACKAGE", "INSUFFICIENT_BALANCE", "TERMINATED"].includes(e?.message)
        ? e.message : undefined;
    if (reason) return { ok: false, reason };
    throw e;
  }
}
