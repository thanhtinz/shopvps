import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: coupons });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt, productType, packageIds } = await req.json();
  if (!code || !type || !value) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: t("Mã đã tồn tại") }, { status: 400 });

  const coupon = await prisma.coupon.create({ data: {
    code: code.toUpperCase(), type, value,
    minOrder: minOrder||null, maxDiscount: maxDiscount||null, usageLimit: usageLimit||null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    productType: productType || null,
    packageIds: Array.isArray(packageIds) ? packageIds : [],
  } });
  return NextResponse.json({ success: true, data: coupon });
}
