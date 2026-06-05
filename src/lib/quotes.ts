import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";
import { getTaxConfig, taxFromInclusive } from "@/lib/settings";

export function generateQuoteNumber(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `QUO-${ym}-${rand}`;
}

export interface QuoteItemInput { description: string; quantity?: number; unitPrice: number; }

/** Compute line + document totals for a quote (prices are tax-inclusive). */
export async function quoteTotals(items: QuoteItemInput[], discount = 0) {
  const lines = items
    .filter((i) => i.description?.trim() && Number(i.unitPrice) >= 0)
    .map((i) => {
      const quantity = Math.max(1, Math.floor(Number(i.quantity) || 1));
      const unitPrice = Number(i.unitPrice) || 0;
      return { description: i.description.trim(), quantity, unitPrice, total: unitPrice * quantity };
    });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const { rate } = await getTaxConfig();
  const tax = taxFromInclusive(total, rate);
  return { lines, subtotal, discount: Number(discount) || 0, tax, total };
}

export type AcceptReason = "NOT_FOUND" | "NOT_OWNER" | "NOT_OPEN" | "EXPIRED";

export interface AcceptResult { ok: boolean; reason?: AcceptReason; invoiceId?: string; }

/**
 * Accept a quote: convert it into an UNPAID invoice the client can then pay,
 * and mark the quote ACCEPTED. Idempotent guards prevent re-accepting.
 */
export async function acceptQuote(quoteId: string, userId: string): Promise<AcceptResult> {
  try {
    let invoiceId = "";
    await prisma.$transaction(async (tx: any) => {
      const quote = await tx.quote.findUnique({ where: { id: quoteId }, include: { items: true } });
      if (!quote) throw new Error("NOT_FOUND");
      if (quote.userId !== userId) throw new Error("NOT_OWNER");
      if (quote.status !== "SENT") throw new Error("NOT_OPEN");
      if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
        await tx.quote.update({ where: { id: quoteId }, data: { status: "EXPIRED" } });
        throw new Error("EXPIRED");
      }

      const invoice = await tx.invoice.create({
        data: {
          userId,
          invoiceNumber: generateInvoiceNumber(),
          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          status: "UNPAID",
          notes: quote.title ? `${quote.title} (${quote.quoteNumber})` : quote.quoteNumber,
          dueDate: quote.validUntil ?? new Date(Date.now() + 7 * 86400000),
          items: {
            create: quote.items.map((it: any) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: it.total,
            })),
          },
        },
      });
      invoiceId = invoice.id;

      await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED", invoiceId: invoice.id } });
    });
    return { ok: true, invoiceId };
  } catch (e: any) {
    const reason: AcceptReason | undefined =
      ["NOT_FOUND", "NOT_OWNER", "NOT_OPEN", "EXPIRED"].includes(e?.message) ? e.message : undefined;
    if (reason) return { ok: false, reason };
    throw e;
  }
}

export async function declineQuote(quoteId: string, userId: string): Promise<AcceptResult> {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { userId: true, status: true } });
  if (!quote) return { ok: false, reason: "NOT_FOUND" };
  if (quote.userId !== userId) return { ok: false, reason: "NOT_OWNER" };
  if (quote.status !== "SENT") return { ok: false, reason: "NOT_OPEN" };
  await prisma.quote.update({ where: { id: quoteId }, data: { status: "DECLINED" } });
  return { ok: true };
}
