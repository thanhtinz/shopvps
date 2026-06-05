import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const packages = await prisma.hostingPackage.findMany({ include: { server: true }, orderBy: [{ serverId: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ success: true, data: packages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const pkg = await prisma.hostingPackage.create({ data: body });
  return NextResponse.json({ success: true, data: pkg });
}
