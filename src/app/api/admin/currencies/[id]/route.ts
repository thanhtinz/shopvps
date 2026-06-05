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
  for (const k of ["name", "symbol", "isActive", "position"]) if (k in b) data[k] = b[k];
  if ("rate" in b) data.rate = parseFloat(b.rate) || 0;
  if ("decimals" in b) data.decimals = parseInt(b.decimals) || 0;
  if ("sortOrder" in b) data.sortOrder = parseInt(b.sortOrder) || 0;

  const item = await prisma.$transaction(async (tx: any) => {
    if (b.isBase === true) {
      await tx.currency.updateMany({ data: { isBase: false } });
      data.isBase = true;
      data.rate = 1; // base currency rate is always 1
      data.isActive = true;
    }
    return tx.currency.update({ where: { id }, data });
  });
  return NextResponse.json({ success: true, data: item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const cur = await prisma.currency.findUnique({ where: { id } });
  if (cur?.isBase) return NextResponse.json({ error: "Không thể xoá tiền tệ cơ sở" }, { status: 400 });
  await prisma.currency.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
