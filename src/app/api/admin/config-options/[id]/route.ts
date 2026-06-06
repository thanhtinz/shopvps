import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const data: any = {};
  for (const k of ["name", "description"]) if (b[k] != null) data[k] = b[k] || null;
  if (typeof b.required === "boolean") data.required = b.required;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  if (b.sortOrder != null) data.sortOrder = parseInt(b.sortOrder, 10) || 0;
  const opt = await prisma.configOption.update({ where: { id: (await params).id }, data });
  return NextResponse.json({ success: true, data: opt });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.configOption.delete({ where: { id: (await params).id } });
  return NextResponse.json({ success: true });
}
