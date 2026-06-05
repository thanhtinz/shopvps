import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  for (const k of ["name", "description", "scope", "isActive"]) if (k in b) data[k] = b[k];
  if ("priceMonthly" in b) data.priceMonthly = parseFloat(b.priceMonthly) || 0;
  if ("sortOrder" in b) data.sortOrder = parseInt(b.sortOrder) || 0;
  const item = await prisma.addon.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.addon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
