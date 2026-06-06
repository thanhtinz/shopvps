import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueVpsProvision } from "@/lib/workers";
import { generateInvoiceNumber } from "@/lib/utils";
import { recordReferralCommission } from "@/lib/affiliate";
import { getTaxForUser, taxFromInclusive } from "@/lib/settings";
import { getServerT, getUserT } from "@/lib/i18n/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const { t, locale } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId, os, billingCycle, hostname, couponCode, region, addonIds } = await req.json();
  if (!packageId || !os || !hostname)
    return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const pkg = await prisma.vpsPackage.findUnique({
    where: { id: packageId, isActive: true },
    include: { provider: true },
  });
  if (!pkg) return NextResponse.json({ error: t("Gói không tồn tại") }, { status: 404 });

  // Tính giá theo billing cycle
  const cycleMultiplier: Record<string, number> = {
    MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12,
  };
  const months = cycleMultiplier[billingCycle] || 1;
  let price = Number(pkg.priceMonthly) * months;

  // Discount nếu billing cycle dài
  if (billingCycle === "ANNUAL" && pkg.priceYearly) price = Number(pkg.priceYearly);

  // Add-ons (configurable options), priced per cycle and added to the order total.
  let addonsData: { id: string; name: string; price: number }[] = [];
  if (Array.isArray(addonIds) && addonIds.length) {
    const addons = await prisma.addon.findMany({ where: { id: { in: addonIds }, isActive: true, scope: { in: ["vps", "both"] } } });
    addonsData = addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.priceMonthly) * months }));
    price += addonsData.reduce((s, a) => s + a.price, 0);
  }

  // Apply coupon (shared validator enforces product scope + limits)
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const cres = await validateCoupon(couponCode, { orderAmount: price, productType: "VPS", packageId }, locale);
    if (!cres.valid) return NextResponse.json({ error: cres.error }, { status: 400 });
    coupon = cres.coupon;
    discount = cres.discount;
  }

  const finalPrice = Math.max(0, price - discount);

  // Check balance
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user && user.status !== "ACTIVE")
    return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });
  if (!user || Number(user.balance) < finalPrice)
    return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm tiền.") }, { status: 400 });

  // Hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})*$/;
  if (!hostnameRegex.test(hostname))
    return NextResponse.json({ error: t("Hostname không hợp lệ") }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);
  const invoiceNumber = generateInvoiceNumber();
  const { rate: taxRate } = await getTaxForUser(session.user.id);
  const tax = taxFromInclusive(finalPrice, taxRate);

  // Transaction
  let result;
  try {
    result = await prisma.$transaction(async (tx: any) => {
    // Deduct balance atomically, only if still sufficient (prevents the
    // check-then-act race where two concurrent orders both pass the balance
    // check above and overdraw the account).
    const deducted = await tx.user.updateMany({
      where: { id: session.user.id, balance: { gte: finalPrice } },
      data: { balance: { decrement: finalPrice } },
    });
    if (deducted.count === 0) throw new Error("INSUFFICIENT_BALANCE");
    const fresh = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });
    const balanceAfter = Number(fresh!.balance);

    // Create VPS order
    const order = await tx.vpsOrder.create({
      data: {
        userId: session.user.id,
        packageId,
        providerId: pkg.providerId,
        hostname,
        os,
        region: region || null,
        status: "PENDING",
        billingCycle,
        price: pkg.priceMonthly,
        expiresAt,
        autoRenew: true,
        addons: addonsData.length ? addonsData : undefined,
      },
    });

    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        subtotal: price,
        discount,
        tax,
        total: finalPrice,
        status: "PAID",
        couponCode: couponCode || null,
        paidAt: new Date(),
        items: {
          create: {
            description: `VPS ${hostname} - ${pkg.name} (${billingCycle})`,
            quantity: 1,
            unitPrice: finalPrice,
            total: finalPrice,
            vpsOrderId: order.id,
          },
        },
      },
    });

    // Transaction record
    const { t: tn } = await getUserT(session.user.id);
    await tx.transaction.create({
      data: {
        userId: session.user.id,
        type: "PURCHASE",
        amount: finalPrice,
        balanceBefore: balanceAfter + finalPrice,
        balanceAfter,
        description: `${tn("Mua VPS")} ${hostname} - ${pkg.name}`,
        status: "COMPLETED",
        reference: invoiceNumber,
      },
    });

    // Increment coupon usage atomically, refusing to exceed the usage limit
    // under concurrent orders.
    if (coupon) {
      const bumped = await tx.coupon.updateMany({
        where: coupon.usageLimit ? { id: coupon.id, usedCount: { lt: coupon.usageLimit } } : { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
      if (bumped.count === 0) throw new Error("COUPON_EXHAUSTED");
    }

    // Activity log
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "vps.order",
        resource: "vps_order",
        resourceId: order.id,
        metadata: { packageId, os, billingCycle, hostname, finalPrice },
      },
    });

    // Referral commission (PENDING until admin approves)
    await recordReferralCommission(tx, session.user.id, order.id, "vps", finalPrice);

    return { order, invoice };
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE")
      return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm tiền.") }, { status: 400 });
    if (e?.message === "COUPON_EXHAUSTED")
      return NextResponse.json({ error: t("Coupon đã hết lượt dùng") }, { status: 400 });
    console.error("VPS order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn hàng") }, { status: 500 });
  }

  // Queue provisioning
  await queueVpsProvision(result.order.id);
  // Renewal is handled by the billing worker: it generates a renewal invoice as
  // expiry approaches and (when auto-pay is on) settles it from the wallet.

  return NextResponse.json({
    success: true,
    data: { orderId: result.order.id, invoiceId: result.invoice.id },
    message: t("VPS đang được khởi tạo, vui lòng chờ trong vài phút."),
  });
}
