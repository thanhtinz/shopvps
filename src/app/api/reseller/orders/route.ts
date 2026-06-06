import { authReseller, unauthorized } from "@/lib/reseller";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, nextExpiry } from "@/lib/utils";
import { getTaxForUser, taxFromInclusive } from "@/lib/settings";
import { isGroupSellable, typeLabel } from "@/lib/products";
import { getUserTier, tierCyclePrice } from "@/lib/pricing";

const CYCLES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"];
const MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

export async function GET(req: Request) {
  const a = await authReseller(req);
  if (!a) return unauthorized();
  const orders = await prisma.productOrder.findMany({ where: { userId: a.userId }, orderBy: { createdAt: "desc" }, take: 100, include: { product: { select: { name: true, category: true } } } });
  return Response.json({ success: true, data: orders.map(o => ({ id: o.id, productId: o.productId, name: o.product?.name, category: o.category, label: o.label, status: o.status, price: Number(o.price), billingCycle: o.billingCycle, expiresAt: o.expiresAt, createdAt: o.createdAt })) });
}

export async function POST(req: Request) {
  const a = await authReseller(req);
  if (!a) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const { productId, label, config } = body;
  const cycle = CYCLES.includes(body.billingCycle) ? body.billingCycle : "MONTHLY";
  if (!productId) return Response.json({ error: "productId is required" }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  if (!(await isGroupSellable(product.group))) return Response.json({ error: "Product not for sale" }, { status: 400 });
  if (product.stock != null && product.stock <= 0) return Response.json({ error: "Out of stock" }, { status: 400 });

  const months = MONTHS[cycle];
  const tier = await getUserTier(a.userId);
  const base = await tierCyclePrice(tier, "product", product.id, Number(product.priceMonthly), product.priceYearly != null ? Number(product.priceYearly) : null, cycle);
  const price = base + Number(product.setupFee || 0);
  const { rate } = await getTaxForUser(a.userId);
  const tax = taxFromInclusive(price, rate);
  const manual = !product.autoActivate;
  const displayLabel = (typeof label === "string" && label.trim()) ? label.trim() : `${typeLabel(product.category)} ${product.name}`;

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const charged = await tx.user.updateMany({ where: { id: a.userId, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      const fresh = await tx.user.findUnique({ where: { id: a.userId }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);
      const created = await tx.productOrder.create({
        data: {
          userId: a.userId, productId: product.id, category: product.category, group: product.group,
          label: displayLabel, status: manual ? "PENDING" : "ACTIVE", billingCycle: cycle, price: base,
          config: config && typeof config === "object" ? config : undefined,
          startDate: new Date(), expiresAt: nextExpiry(null, months),
        },
      });
      if (product.stock != null) await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: 1 } } });
      const invoiceNumber = generateInvoiceNumber();
      await tx.invoice.create({ data: { userId: a.userId, invoiceNumber, subtotal: price, discount: 0, tax, total: price, status: "PAID", paidAt: new Date(), items: { create: { description: `${product.name} — ${displayLabel} (${cycle})`, quantity: 1, unitPrice: price, total: price, productOrderId: created.id } } } });
      await tx.transaction.create({ data: { userId: a.userId, type: "PURCHASE", amount: price, balanceBefore: balanceAfter + price, balanceAfter, description: `[API] ${product.name} — ${displayLabel}`, status: "COMPLETED", reference: invoiceNumber } });
      return created;
    });
    return Response.json({ success: true, data: { id: order.id, status: order.status, price, expiresAt: order.expiresAt } });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return Response.json({ error: "Insufficient balance" }, { status: 402 });
    console.error("reseller order error:", e);
    return Response.json({ error: "Could not create order" }, { status: 500 });
  }
}
