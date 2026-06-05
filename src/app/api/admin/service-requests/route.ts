import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CYCLE_MONTHS } from "@/lib/proration";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

function cyclePrice(pkg: any, cycle: string): number {
  const months = CYCLE_MONTHS[cycle] || 1;
  if (cycle === "ANNUAL" && pkg.priceYearly) return Number(pkg.priceYearly);
  return Number(pkg.priceMonthly) * months;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where: any = status ? { status } : {};
  const items = await prisma.serviceRequest.findMany({
    where,
    include: { user: { select: { name: true, email: true, balance: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Resolve order + target package labels for display.
  const enriched = await Promise.all(items.map(async (r) => {
    const order: any = r.serviceType === "vps"
      ? (r.vpsOrderId ? await prisma.vpsOrder.findUnique({ where: { id: r.vpsOrderId }, select: { hostname: true, status: true, package: { select: { name: true } } } }) : null)
      : (r.hostingOrderId ? await prisma.hostingOrder.findUnique({ where: { id: r.hostingOrderId }, select: { domain: true, status: true, package: { select: { name: true } } } }) : null);
    let targetName: string | null = null;
    if (r.targetPackageId) {
      const tp: any = r.serviceType === "vps"
        ? await prisma.vpsPackage.findUnique({ where: { id: r.targetPackageId }, select: { name: true } })
        : await prisma.hostingPackage.findUnique({ where: { id: r.targetPackageId }, select: { name: true } });
      targetName = tp?.name || null;
    }
    return { ...r, order, targetName };
  }));

  const pending = await prisma.serviceRequest.count({ where: { status: "PENDING" } });
  return NextResponse.json({ success: true, data: { items: enriched, pending } });
}

export async function PATCH(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, adminNote, amount } = await req.json();
  if (!id || !["approve", "reject"].includes(action))
    return NextResponse.json({ error: t("Yêu cầu không hợp lệ") }, { status: 400 });

  if (action === "reject") {
    await prisma.serviceRequest.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", adminNote: adminNote || null, processedAt: new Date() } });
    return NextResponse.json({ success: true });
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const r = await tx.serviceRequest.findUnique({ where: { id } });
      if (!r || r.status !== "PENDING") throw new Error("ALREADY_PROCESSED");

      const amt = Math.round(typeof amount === "number" && Number.isFinite(amount) ? amount : Number(r.amount)); // signed

      // Apply the wallet effect atomically.
      if (amt > 0) {
        const charged = await tx.user.updateMany({ where: { id: r.userId, balance: { gte: amt } }, data: { balance: { decrement: amt } } });
        if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      } else if (amt < 0) {
        await tx.user.update({ where: { id: r.userId }, data: { balance: { increment: -amt } } });
      }
      if (amt !== 0) {
        const fresh = await tx.user.findUnique({ where: { id: r.userId }, select: { balance: true } });
        const balanceAfter = Number(fresh!.balance);
        await tx.transaction.create({
          data: {
            userId: r.userId,
            type: amt > 0 ? "PURCHASE" : "REFUND",
            amount: Math.abs(amt),
            balanceBefore: amt > 0 ? balanceAfter + amt : balanceAfter - (-amt),
            balanceAfter,
            description: `${r.type} dịch vụ ${r.serviceType.toUpperCase()}`,
            status: "COMPLETED",
          },
        });
      }

      // Apply the order change.
      const orderId = r.serviceType === "vps" ? r.vpsOrderId : r.hostingOrderId;
      if (r.type === "CANCEL") {
        const data: any = r.cancelMode === "IMMEDIATE" ? { status: "TERMINATED", autoRenew: false } : { autoRenew: false };
        if (r.serviceType === "vps") await tx.vpsOrder.update({ where: { id: orderId }, data });
        else await tx.hostingOrder.update({ where: { id: orderId }, data });
      } else if (r.type === "UPGRADE" || r.type === "DOWNGRADE") {
        const order: any = r.serviceType === "vps"
          ? await tx.vpsOrder.findUnique({ where: { id: orderId } })
          : await tx.hostingOrder.findUnique({ where: { id: orderId } });
        const pkg: any = r.serviceType === "vps"
          ? await tx.vpsPackage.findUnique({ where: { id: r.targetPackageId } })
          : await tx.hostingPackage.findUnique({ where: { id: r.targetPackageId } });
        if (order && pkg) {
          const newPrice = cyclePrice(pkg, order.billingCycle);
          if (r.serviceType === "vps") await tx.vpsOrder.update({ where: { id: orderId }, data: { packageId: r.targetPackageId, price: newPrice } });
          else await tx.hostingOrder.update({ where: { id: orderId }, data: { packageId: r.targetPackageId, price: newPrice } });
        }
      }

      await tx.serviceRequest.update({ where: { id }, data: { status: "COMPLETED", adminNote: adminNote || null, amount: amt, processedAt: new Date() } });

      await tx.notification.create({
        data: {
          userId: r.userId,
          type: "INFO",
          title: "Yêu cầu dịch vụ đã được xử lý",
          content: `Yêu cầu ${r.type} dịch vụ ${r.serviceType.toUpperCase()} của bạn đã được duyệt.`,
        },
      });
    });
  } catch (e: any) {
    if (e?.message === "ALREADY_PROCESSED") return NextResponse.json({ error: t("Yêu cầu đã được xử lý") }, { status: 400 });
    if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Khách không đủ số dư để thanh toán phần chênh lệch") }, { status: 400 });
    console.error("service-request approve error:", e);
    return NextResponse.json({ error: t("Không thể xử lý yêu cầu") }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
