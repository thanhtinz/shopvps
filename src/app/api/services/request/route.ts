import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CYCLE_MONTHS, prorateChange, prorateRefund } from "@/lib/proration";
import { getServerT } from "@/lib/i18n/server";

function cyclePrice(pkg: { priceMonthly: any; priceYearly: any }, cycle: string): number {
  const months = CYCLE_MONTHS[cycle] || 1;
  if (cycle === "ANNUAL" && pkg.priceYearly) return Number(pkg.priceYearly);
  return Number(pkg.priceMonthly) * months;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.serviceRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceType, orderId, type, targetPackageId, cancelMode, note } = await req.json();
  if (!["vps", "hosting"].includes(serviceType) || !orderId || !["CANCEL", "UPGRADE", "DOWNGRADE", "ADDON"].includes(type))
    return NextResponse.json({ error: t("Yêu cầu không hợp lệ") }, { status: 400 });

  // Verify ownership + that the service is active.
  const order: any = serviceType === "vps"
    ? await prisma.vpsOrder.findFirst({ where: { id: orderId, userId: session.user.id } })
    : await prisma.hostingOrder.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order) return NextResponse.json({ error: t("Không tìm thấy dịch vụ") }, { status: 404 });
  if (order.status !== "ACTIVE") return NextResponse.json({ error: t("Chỉ áp dụng cho dịch vụ đang hoạt động") }, { status: 400 });

  // One open request per service at a time.
  const dupKey = serviceType === "vps" ? { vpsOrderId: orderId } : { hostingOrderId: orderId };
  const existing = await prisma.serviceRequest.findFirst({ where: { ...dupKey, status: "PENDING" } });
  if (existing) return NextResponse.json({ error: t("Đã có yêu cầu đang chờ xử lý cho dịch vụ này") }, { status: 400 });

  let amount = 0;
  if (type === "CANCEL") {
    const mode = cancelMode === "IMMEDIATE" ? "IMMEDIATE" : "END_OF_TERM";
    if (mode === "IMMEDIATE") amount = -prorateRefund(Number(order.price), order.billingCycle, order.expiresAt);
    const created = await create(session.user.id, serviceType, orderId, "CANCEL", null, mode, note, amount);
    return NextResponse.json({ success: true, data: created });
  }

  if (type === "UPGRADE" || type === "DOWNGRADE") {
    if (!targetPackageId) return NextResponse.json({ error: t("Thiếu gói đích") }, { status: 400 });
    if (targetPackageId === order.packageId) return NextResponse.json({ error: t("Gói đích trùng gói hiện tại") }, { status: 400 });
    const pkg: any = serviceType === "vps"
      ? await prisma.vpsPackage.findUnique({ where: { id: targetPackageId } })
      : await prisma.hostingPackage.findUnique({ where: { id: targetPackageId } });
    if (!pkg) return NextResponse.json({ error: t("Gói đích không tồn tại") }, { status: 404 });
    const newPrice = cyclePrice(pkg, order.billingCycle);
    amount = prorateChange(Number(order.price), newPrice, order.billingCycle, order.expiresAt);
    const created = await create(session.user.id, serviceType, orderId, type, targetPackageId, null, note, amount);
    return NextResponse.json({ success: true, data: created });
  }

  // ADDON — fulfilled manually by admin, who sets the amount on approval.
  const created = await create(session.user.id, serviceType, orderId, "ADDON", null, null, note, 0);
  return NextResponse.json({ success: true, data: created });
}

function create(userId: string, serviceType: string, orderId: string, type: any, targetPackageId: string | null, cancelMode: string | null, note: string | undefined, amount: number) {
  return prisma.serviceRequest.create({
    data: {
      userId,
      serviceType,
      type,
      vpsOrderId: serviceType === "vps" ? orderId : null,
      hostingOrderId: serviceType === "hosting" ? orderId : null,
      targetPackageId,
      cancelMode,
      note: note?.trim() || null,
      amount,
    },
  });
}
