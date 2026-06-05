import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";
import { HOSTING_PACKAGE_FIELDS } from "../route";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const pkg = await prisma.hostingPackage.update({ where: { id: (await params).id }, data: pick(body, HOSTING_PACKAGE_FIELDS) as any });
  return NextResponse.json({ success: true, data: pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.hostingPackage.update({ where: { id: (await params).id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
