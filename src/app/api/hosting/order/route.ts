import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueHostingProvision } from "@/lib/workers";
import { generateInvoiceNumber } from "@/lib/utils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId, domain, billingCycle, couponCode } = await req.json();
  if (!packageId || !domain) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const pkg = await prisma.hostingPackage.findUnique({
    where: { id: packageId, isActive: true },
    include: { server: true },
  });
  if (!pkg) return NextResponse.json({ error: "Gói không tồn tại" }, { status: 404 });

  // Check domain not already in use
  const domainExists = await prisma.hostingOrder.findFirst({ where: { domain, status: { not: "TERMINATED" } } });
  if (domainExists) return NextResponse.json({ error: "Domain đã được sử dụng" }, { status: 400 });

  const cycleMultiplier: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
  const months = cycleMultiplier[billingCycle] || 1;
  let price = Number(pkg.priceMonthly) * months;
  if (billingCycle === "ANNUAL" && pkg.priceYearly) price = Number(pkg.priceYearly);

  // Coupon
  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({ where: { code: couponCode.toUpperCase(), isActive: true } });
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (coupon.type === "PERCENTAGE") discount = Math.floor(price * Number(coupon.value) / 100);
      else discount = Number(coupon.value);
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const finalPrice = Math.max(0, price - discount);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || Number(user.balance) < finalPrice)
    return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 });

  // Generate cPanel username from domain
  const cpanelUsername = domain.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase() +
    crypto.randomBytes(2).toString("hex");
  const cpanelPassword = crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) + "A1!";

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  const invoiceNumber = generateInvoiceNumber();

  const result = await prisma.$transaction(async (tx: any) => {
    await tx.user.update({ where: { id: session.user.id }, data: { balance: { decrement: finalPrice } } });

    const order = await tx.hostingOrder.create({
      data: {
        userId: session.user.id, packageId, serverId: pkg.serverId,
        domain, cpanelUsername, cpanelPassword,
        status: "PENDING", billingCycle,
        price: pkg.priceMonthly, expiresAt, autoRenew: true,
      },
    });

    await tx.invoice.create({
      data: {
        userId: session.user.id, invoiceNumber,
        subtotal: price, discount, total: finalPrice,
        status: "PAID", paidAt: new Date(),
        items: { create: { description: `Hosting ${domain} - ${pkg.name}`, quantity: 1, unitPrice: finalPrice, total: finalPrice, hostingOrderId: order.id } },
      },
    });

    await tx.transaction.create({
      data: {
        userId: session.user.id, type: "PURCHASE", amount: finalPrice,
        balanceBefore: Number(user!.balance), balanceAfter: Number(user!.balance) - finalPrice,
        description: `Mua Hosting ${domain}`, status: "COMPLETED", reference: invoiceNumber,
      },
    });

    return order;
  });

  await queueHostingProvision(result.id);

  return NextResponse.json({
    success: true,
    data: { orderId: result.id },
    message: "Hosting đang được khởi tạo, vui lòng chờ trong vài phút.",
  });
}
