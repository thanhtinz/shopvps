import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.addon.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "Thiếu tên add-on" }, { status: 400 });
  const item = await prisma.addon.create({
    data: {
      name: b.name, description: b.description || null,
      scope: ["vps", "hosting", "both"].includes(b.scope) ? b.scope : "both",
      priceMonthly: parseFloat(b.priceMonthly) || 0,
      isActive: b.isActive ?? true, sortOrder: parseInt(b.sortOrder) || 0,
    },
  });
  return NextResponse.json({ success: true, data: item });
}
