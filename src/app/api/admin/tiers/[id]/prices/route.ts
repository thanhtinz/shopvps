import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const prices = await prisma.tierPrice.findMany({ where: { tierId: id } });
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, category: true, priceMonthly: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: { prices, products } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { scope, refId, priceMonthly, priceYearly } = await req.json();
  const sc = ["product", "vps", "hosting"].includes(scope) ? scope : "product";
  if (!refId || priceMonthly == null) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const price = await prisma.tierPrice.upsert({
    where: { tierId_scope_refId: { tierId: id, scope: sc, refId } },
    update: { priceMonthly: Number(priceMonthly) || 0, priceYearly: priceYearly ? Number(priceYearly) : null },
    create: { tierId: id, scope: sc, refId, priceMonthly: Number(priceMonthly) || 0, priceYearly: priceYearly ? Number(priceYearly) : null },
  });
  return NextResponse.json({ success: true, data: price });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const priceId = new URL(req.url).searchParams.get("priceId");
  if (priceId) await prisma.tierPrice.deleteMany({ where: { id: priceId, tierId: id } });
  return NextResponse.json({ success: true });
}
