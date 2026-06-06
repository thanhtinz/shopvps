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
  for (const k of ["name", "icon", "description", "eggId", "dockerImage"]) if (b[k] != null) data[k] = b[k] || null;
  if (b.minRam != null) data.minRam = parseInt(b.minRam, 10) || 1024;
  if (b.sortOrder != null) data.sortOrder = parseInt(b.sortOrder, 10) || 0;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  const game = await prisma.game.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: game });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.game.delete({ where: { id: (await params).id } });
  return NextResponse.json({ success: true });
}
