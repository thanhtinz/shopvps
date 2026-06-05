import { prisma } from "@/lib/prisma";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

export type RefundReason = "NOT_FOUND" | "NOT_REFUNDABLE" | "INVALID_AMOUNT";
export interface RefundResult { ok: boolean; reason?: RefundReason; amount?: number; partial?: boolean; }

/**
 * Refund a PAID invoice: credit the customer's wallet, record a REFUND
 * transaction (the credit-note trail) and update the invoice. A full refund
 * marks it REFUNDED; a partial refund (amount < total) leaves it PAID and notes
 * the partial credit. The service itself is left untouched — admins terminate
 * separately if needed.
 *
 * @param amount the amount to refund; omit/0 for a full refund of the total.
 */
export async function refundInvoice(invoiceId: string, note?: string, loc: Locale = "vi", amount?: number): Promise<RefundResult> {
  try {
    let refunded = 0;
    let partial = false;
    await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.status !== "PAID") throw new Error("NOT_REFUNDABLE");

      const total = Number(invoice.total);
      refunded = amount && amount > 0 ? Math.min(amount, total) : total;
      if (!(refunded > 0)) throw new Error("INVALID_AMOUNT");
      partial = refunded < total;

      const user = await tx.user.findUnique({ where: { id: invoice.userId }, select: { balance: true } });
      const balanceBefore = Number(user!.balance);
      const balanceAfter = balanceBefore + refunded;

      await tx.user.update({ where: { id: invoice.userId }, data: { balance: { increment: refunded } } });

      const label = partial ? translate(loc, "Hoàn tiền một phần hoá đơn") : translate(loc, "Hoàn tiền hoá đơn");
      await tx.transaction.create({
        data: {
          userId: invoice.userId, type: "REFUND", amount: refunded,
          balanceBefore, balanceAfter,
          description: `${label} ${invoice.invoiceNumber}${note ? ` — ${note}` : ""}`,
          status: "COMPLETED", reference: invoice.invoiceNumber,
        },
      });

      const partialNote = partial ? `${translate(loc, "Hoàn một phần")}: ${refunded}` : null;
      const mergedNote = [invoice.notes, partialNote, note].filter(Boolean).join(" · ") || invoice.notes;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: partial ? "PAID" : "REFUNDED", notes: mergedNote },
      });

      await tx.notification.create({
        data: {
          userId: invoice.userId, type: "INFO",
          title: translate(loc, "Hoá đơn đã được hoàn tiền"),
          content: `${translate(loc, "Hoá đơn")} ${invoice.invoiceNumber} ${translate(loc, "đã được hoàn vào số dư ví của bạn.")}`,
        },
      });
    });
    return { ok: true, amount: refunded, partial };
  } catch (e: any) {
    const reason: RefundReason | undefined =
      ["NOT_FOUND", "NOT_REFUNDABLE", "INVALID_AMOUNT"].includes(e?.message) ? e.message : undefined;
    if (reason) return { ok: false, reason };
    throw e;
  }
}
