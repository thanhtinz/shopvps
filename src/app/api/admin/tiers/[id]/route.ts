import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  if (b.name != null) data.name = String(b.name);
  if (b.discountPercent != null) data.discountPercent = Math.max(0, Math.min(100, Number(b.discountPercent) || 0));
  if (typeof b.isReseller === "boolean") data.isReseller = b.isReseller;
  if (b.sortOrder != null) data.sortOrder = parseInt(b.sortOrder, 10) || 0;
  if (b.isDefault === true) { await prisma.priceTier.updateMany({ data: { isDefault: false } }); data.isDefault = true; }
  const tier = await prisma.priceTier.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: tier });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.user.updateMany({ where: { tierId: id }, data: { tierId: null } });
  await prisma.priceTier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
