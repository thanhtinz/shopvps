import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCurrencies, getBaseCurrency } from "@/lib/currency";
import { getServerT } from "@/lib/i18n/server";

export async function GET() {
  const [currencies, base, session] = await Promise.all([getActiveCurrencies(), getBaseCurrency(), auth()]);
  let preferred = base.code;
  if (session) {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { preferredCurrency: true } });
    if (u?.preferredCurrency) preferred = u.preferredCurrency;
  }
  return NextResponse.json({ success: true, data: { currencies, base: base.code, preferred } });
}

// Set the signed-in user's preferred display currency.
export async function PATCH(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await req.json();
  const cur = await prisma.currency.findFirst({ where: { code, isActive: true } });
  if (!cur && code !== "VND") return NextResponse.json({ error: t("Tiền tệ không hợp lệ") }, { status: 400 });
  await prisma.user.update({ where: { id: session.user.id }, data: { preferredCurrency: code } });
  return NextResponse.json({ success: true });
}
