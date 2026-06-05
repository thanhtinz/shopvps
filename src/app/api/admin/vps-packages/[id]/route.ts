import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(session: any) { return session && ["ADMIN","SUPER_ADMIN"].includes((session.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const pkg = await prisma.vpsPackage.update({ where: { id: (await params).id }, data: body });
  return NextResponse.json({ success: true, data: pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.vpsPackage.update({ where: { id: (await params).id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
