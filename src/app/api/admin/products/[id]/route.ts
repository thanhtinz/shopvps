import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  for (const k of ["name", "description"]) if (b[k] != null) data[k] = b[k] || null;
  if (b.priceMonthly != null) data.priceMonthly = Number(b.priceMonthly) || 0;
  if (b.priceYearly != null) data.priceYearly = b.priceYearly ? Number(b.priceYearly) : null;
  if (b.setupFee != null) data.setupFee = Number(b.setupFee) || 0;
  if (b.sortOrder != null) data.sortOrder = parseInt(b.sortOrder, 10) || 0;
  if (b.stock !== undefined) data.stock = b.stock === "" || b.stock == null ? null : parseInt(b.stock, 10);
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  if (typeof b.autoActivate === "boolean") data.autoActivate = b.autoActivate;
  if (b.specs !== undefined) { try { data.specs = b.specs ? (typeof b.specs === "string" ? JSON.parse(b.specs) : b.specs) : null; } catch { return NextResponse.json({ error: t("Specs JSON không hợp lệ") }, { status: 400 }); } }
  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const inUse = await prisma.productOrder.count({ where: { productId: id } });
  if (inUse > 0) { await prisma.product.update({ where: { id }, data: { isActive: false } }); return NextResponse.json({ success: true, softDeleted: true }); }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
