import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";
import { getTaxForUser, taxFromInclusive } from "@/lib/settings";
import { cyclePrice, isGroupSellable, typeLabel } from "@/lib/products";
import { nextExpiry } from "@/lib/utils";
import { getServerT, getUserT } from "@/lib/i18n/server";

const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, billingCycle, label, config } = await req.json();
  const cycle = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"].includes(billingCycle) ? billingCycle : "MONTHLY";
  if (!productId) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return NextResponse.json({ error: t("Sản phẩm không tồn tại") }, { status: 404 });
  if (!(await isGroupSellable(product.group))) return NextResponse.json({ error: t("Sản phẩm hiện không được bán") }, { status: 400 });
  if (product.stock != null && product.stock <= 0) return NextResponse.json({ error: t("Sản phẩm đã hết hàng") }, { status: 400 });

  const months = CYCLE_MONTHS[cycle] || 1;
  const price = cyclePrice(product, cycle) + Number(product.setupFee || 0);
  const { rate } = await getTaxForUser(session.user.id);
  const tax = taxFromInclusive(price, rate);

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (user && user.status !== "ACTIVE") return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });

  const manual = !product.autoActivate;
  const displayLabel = (typeof label === "string" && label.trim()) ? label.trim() : `${typeLabel(product.category)} ${product.name}`;

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const charged = await tx.user.updateMany({ where: { id: session.user.id, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);

      const created = await tx.productOrder.create({
        data: {
          userId: session.user.id, productId: product.id, category: product.category, group: product.group,
          label: displayLabel, status: manual ? "PENDING" : "ACTIVE",
          billingCycle: cycle, price: cyclePrice(product, cycle),
          config: config && typeof config === "object" ? config : undefined,
          startDate: new Date(), expiresAt: nextExpiry(null, months),
        },
      });

      if (product.stock != null) await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: 1 } } });

      const invoiceNumber = generateInvoiceNumber();
      const invoice = await tx.invoice.create({
        data: {
          userId: session.user.id, invoiceNumber, subtotal: price, discount: 0, tax, total: price,
          status: "PAID", paidAt: new Date(),
          items: { create: { description: `${product.name} — ${displayLabel} (${cycle})`, quantity: 1, unitPrice: price, total: price, productOrderId: created.id } },
        },
      });

      const { t: tn } = await getUserT(session.user.id);
      await tx.transaction.create({
        data: {
          userId: session.user.id, type: "PURCHASE", amount: price,
          balanceBefore: balanceAfter + price, balanceAfter,
          description: `${tn("Mua")} ${product.name} — ${displayLabel}`, status: "COMPLETED", reference: invoiceNumber,
        },
      });
      return created;
    });

    return NextResponse.json({
      success: true, data: order,
      message: manual ? t("Đặt hàng thành công, đang chờ kích hoạt.") : t("Đặt hàng thành công."),
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm.") }, { status: 400 });
    console.error("product order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn hàng") }, { status: 500 });
  }
}
