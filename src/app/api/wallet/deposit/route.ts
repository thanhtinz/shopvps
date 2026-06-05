import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrency, toBase } from "@/lib/currency";
import { getGateway, parseConfig } from "@/lib/payments";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, currencyCode, gatewayCode } = await req.json();
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return NextResponse.json({ error: t("Số tiền không hợp lệ") }, { status: 400 });

  const currency = await getCurrency(currencyCode || "VND");
  if (!currency) return NextResponse.json({ error: t("Tiền tệ không hợp lệ") }, { status: 400 });

  const gw = getGateway(gatewayCode);
  const row = await prisma.paymentGateway.findUnique({ where: { code: gatewayCode || "" } });
  if (!gw || !row?.isActive) return NextResponse.json({ error: t("Cổng thanh toán không khả dụng") }, { status: 400 });

  const amountBase = toBase(amt, currency);
  if (amountBase < 1000) return NextResponse.json({ error: t("Số tiền tối thiểu 1.000đ") }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, balance: true } });
  const reference = `${gw.code}-${randomUUID().slice(0, 12)}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  // Pre-create a pending transaction for gateways that reconcile by reference.
  if (gw.createsPendingTxn) {
    const bal = Number(user?.balance || 0);
    await prisma.transaction.create({
      data: {
        userId: session.user.id, type: "DEPOSIT", amount: amountBase,
        balanceBefore: bal, balanceAfter: bal, status: "PENDING",
        gateway: gw.code, currency: currency.code, currencyAmount: amt,
        reference, description: `Nạp tiền qua ${gw.label}`,
      },
    });
  }

  try {
    const result = await gw.initiate({
      reference, amountBase, amountCurrency: amt, currency,
      userId: session.user.id, userEmail: user?.email || "", appUrl,
      config: parseConfig(row.config),
    });
    return NextResponse.json({ success: true, data: { ...result, reference, auto: gw.auto } });
  } catch (e: any) {
    if (gw.createsPendingTxn) await prisma.transaction.deleteMany({ where: { reference, status: "PENDING" } }).catch(() => {});
    return NextResponse.json({ error: e?.message || t("Không khởi tạo được thanh toán") }, { status: 500 });
  }
}
