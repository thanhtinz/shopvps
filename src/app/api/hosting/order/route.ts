import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueHostingProvision } from "@/lib/workers";
import { generateInvoiceNumber } from "@/lib/utils";
import { recordReferralCommission } from "@/lib/affiliate";
import { getTaxConfig, taxFromInclusive } from "@/lib/settings";
import { encrypt } from "@/lib/encrypt";
import { getServerT, getUserT } from "@/lib/i18n/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId, domain, billingCycle, couponCode, addonIds } = await req.json();
  if (!packageId || !domain) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const pkg = await prisma.hostingPackage.findUnique({
    where: { id: packageId, isActive: true },
    include: { server: true },
  });
  if (!pkg) return NextResponse.json({ error: t("Gói không tồn tại") }, { status: 404 });

  // Check domain not already in use
  const domainExists = await prisma.hostingOrder.findFirst({ where: { domain, status: { not: "TERMINATED" } } });
  if (domainExists) return NextResponse.json({ error: t("Domain đã được sử dụng") }, { status: 400 });

  const cycleMultiplier: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
  const months = cycleMultiplier[billingCycle] || 1;
  let price = Number(pkg.priceMonthly) * months;
  if (billingCycle === "ANNUAL" && pkg.priceYearly) price = Number(pkg.priceYearly);

  // Add-ons (configurable options), priced per cycle.
  let addonsData: { id: string; name: string; price: number }[] = [];
  if (Array.isArray(addonIds) && addonIds.length) {
    const addons = await prisma.addon.findMany({ where: { id: { in: addonIds }, isActive: true, scope: { in: ["hosting", "both"] } } });
    addonsData = addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.priceMonthly) * months }));
    price += addonsData.reduce((s, a) => s + a.price, 0);
  }

  // Coupon
  let discount = 0;
  let appliedCouponId: string | null = null;
  let appliedCouponLimit: number | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({ where: { code: couponCode.toUpperCase(), isActive: true } });
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
        return NextResponse.json({ error: t("Coupon đã hết lượt dùng") }, { status: 400 });
      if (coupon.minOrder && price < Number(coupon.minOrder))
        return NextResponse.json({ error: `Đơn tối thiểu ${coupon.minOrder}đ` }, { status: 400 });
      if (coupon.type === "PERCENTAGE") discount = Math.floor(price * Number(coupon.value) / 100);
      else discount = Number(coupon.value);
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
      // Defer the usage increment into the transaction below so it is not
      // applied when the order ultimately fails (e.g. insufficient balance).
      appliedCouponId = coupon.id;
      appliedCouponLimit = coupon.usageLimit;
    }
  }

  const finalPrice = Math.max(0, price - discount);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user && user.status !== "ACTIVE")
    return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });
  if (!user || Number(user.balance) < finalPrice)
    return NextResponse.json({ error: t("Số dư không đủ") }, { status: 400 });

  // Generate cPanel username from domain
  const cpanelUsername = domain.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase() +
    crypto.randomBytes(2).toString("hex");
  const cpanelPassword = crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) + "A1!";
  // Store the cPanel password encrypted at rest; decrypt only when provisioning.
  const cpanelPasswordEnc = encrypt(cpanelPassword);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  const invoiceNumber = generateInvoiceNumber();
  const { rate: taxRate } = await getTaxConfig();
  const tax = taxFromInclusive(finalPrice, taxRate);

  let result;
  try {
    result = await prisma.$transaction(async (tx: any) => {
    // Atomic, race-safe balance deduction.
    const deducted = await tx.user.updateMany({
      where: { id: session.user.id, balance: { gte: finalPrice } },
      data: { balance: { decrement: finalPrice } },
    });
    if (deducted.count === 0) throw new Error("INSUFFICIENT_BALANCE");
    const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
    const balanceAfter = Number(fresh!.balance);

    const order = await tx.hostingOrder.create({
      data: {
        userId: session.user.id, packageId, serverId: pkg.serverId,
        domain, cpanelUsername, cpanelPassword: cpanelPasswordEnc,
        status: "PENDING", billingCycle,
        price: pkg.priceMonthly, expiresAt, autoRenew: true,
        addons: addonsData.length ? addonsData : undefined,
      },
    });

    await tx.invoice.create({
      data: {
        userId: session.user.id, invoiceNumber,
        subtotal: price, discount, tax, total: finalPrice,
        status: "PAID", paidAt: new Date(),
        items: { create: { description: `Hosting ${domain} - ${pkg.name}`, quantity: 1, unitPrice: finalPrice, total: finalPrice, hostingOrderId: order.id } },
      },
    });

    const { t: tn } = await getUserT(session.user.id);
    await tx.transaction.create({
      data: {
        userId: session.user.id, type: "PURCHASE", amount: finalPrice,
        balanceBefore: balanceAfter + finalPrice, balanceAfter,
        description: `${tn("Mua Hosting")} ${domain}`, status: "COMPLETED", reference: invoiceNumber,
      },
    });

    if (appliedCouponId) {
      const bumped = await tx.coupon.updateMany({
        where: appliedCouponLimit ? { id: appliedCouponId, usedCount: { lt: appliedCouponLimit } } : { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
      if (bumped.count === 0) throw new Error("COUPON_EXHAUSTED");
    }

    // Referral commission (PENDING until admin approves)
    await recordReferralCommission(tx, session.user.id, order.id, "hosting", finalPrice);

    return order;
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE")
      return NextResponse.json({ error: t("Số dư không đủ") }, { status: 400 });
    if (e?.message === "COUPON_EXHAUSTED")
      return NextResponse.json({ error: t("Coupon đã hết lượt dùng") }, { status: 400 });
    console.error("Hosting order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn hàng") }, { status: 500 });
  }

  await queueHostingProvision(result.id);
  // Renewal handled by the billing worker (invoice generation + optional auto-pay).

  return NextResponse.json({
    success: true,
    data: { orderId: result.id },
    message: t("Hosting đang được khởi tạo, vui lòng chờ trong vài phút."),
  });
}
