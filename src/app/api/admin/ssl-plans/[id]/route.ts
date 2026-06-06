import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json(); const data: any = {};
  for (const k of ["name","brand"]) if (b[k] != null) data[k] = b[k] || null;
  if (b.type) data.type = b.type;
  if (typeof b.wildcard === "boolean") data.wildcard = b.wildcard;
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  if (b.years != null) data.years = parseInt(b.years, 10) || 1;
  if (b.price != null) data.price = Number(b.price) || 0;
  if (b.sortOrder != null) data.sortOrder = parseInt(b.sortOrder, 10) || 0;
  return NextResponse.json({ success: true, data: await prisma.sslPlan.update({ where: { id: (await params).id }, data }) });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.sslPlan.delete({ where: { id: (await params).id } });
  return NextResponse.json({ success: true });
}
