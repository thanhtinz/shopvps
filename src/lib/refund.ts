import { prisma } from "@/lib/prisma";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

export type RefundReason = "NOT_FOUND" | "NOT_REFUNDABLE";
export interface RefundResult { ok: boolean; reason?: RefundReason; amount?: number; }

/**
 * Refund a PAID invoice: credit the customer's wallet for the full total, record
 * a REFUND transaction (the credit-note trail), and mark the invoice REFUNDED.
 * The service itself is left untouched — admins terminate separately if needed.
 */
export async function refundInvoice(invoiceId: string, note?: string, loc: Locale = "vi"): Promise<RefundResult> {
  try {
    let amount = 0;
    await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.status !== "PAID") throw new Error("NOT_REFUNDABLE");
      amount = Number(invoice.total);

      const user = await tx.user.findUnique({ where: { id: invoice.userId }, select: { balance: true } });
      const balanceBefore = Number(user!.balance);
      const balanceAfter = balanceBefore + amount;

      await tx.user.update({ where: { id: invoice.userId }, data: { balance: { increment: amount } } });

      await tx.transaction.create({
        data: {
          userId: invoice.userId, type: "REFUND", amount,
          balanceBefore, balanceAfter,
          description: `${translate(loc, "Hoàn tiền hoá đơn")} ${invoice.invoiceNumber}${note ? ` — ${note}` : ""}`,
          status: "COMPLETED", reference: invoice.invoiceNumber,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "REFUNDED", notes: note ? `${invoice.notes ? invoice.notes + " · " : ""}${note}` : invoice.notes },
      });

      await tx.notification.create({
        data: {
          userId: invoice.userId, type: "INFO",
          title: translate(loc, "Hoá đơn đã được hoàn tiền"),
          content: `${translate(loc, "Hoá đơn")} ${invoice.invoiceNumber} ${translate(loc, "đã được hoàn vào số dư ví của bạn.")}`,
        },
      });
    });
    return { ok: true, amount };
  } catch (e: any) {
    const reason: RefundReason | undefined =
      ["NOT_FOUND", "NOT_REFUNDABLE"].includes(e?.message) ? e.message : undefined;
    if (reason) return { ok: false, reason };
    throw e;
  }
}
