import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tiers = await prisma.priceTier.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { users: true, prices: true } } } });
  return NextResponse.json({ success: true, data: tiers });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, discountPercent, isDefault, isReseller, sortOrder } = await req.json();
  if (!name) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  if (isDefault) await prisma.priceTier.updateMany({ data: { isDefault: false } });
  const tier = await prisma.priceTier.create({
    data: {
      name: String(name), discountPercent: Math.max(0, Math.min(100, Number(discountPercent) || 0)),
      isDefault: !!isDefault, isReseller: !!isReseller, sortOrder: parseInt(sortOrder, 10) || 0,
    },
  });
  return NextResponse.json({ success: true, data: tier });
}
