import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.label != null) data.label = String(body.label);
  if (body.rate != null) data.rate = Math.max(0, Math.min(100, parseFloat(body.rate) || 0));
  const rule = await prisma.taxRule.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: rule });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.taxRule.delete({ where: { id: (await params).id } });
  return NextResponse.json({ success: true });
}
