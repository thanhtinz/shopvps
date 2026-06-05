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
  if ("name" in b) data.name = b.name;
  if ("isActive" in b) data.isActive = !!b.isActive;
  if ("config" in b) {
    // Validate JSON before storing.
    try { JSON.parse(b.config); } catch { return NextResponse.json({ error: "Config phải là JSON hợp lệ" }, { status: 400 }); }
    data.config = b.config;
  }
  const item = await prisma.paymentGateway.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: item });
}
