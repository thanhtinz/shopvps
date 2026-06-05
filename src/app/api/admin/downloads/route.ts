import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.download.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.title?.trim() || !b.url?.trim()) return NextResponse.json({ error: "Thiếu tiêu đề hoặc URL" }, { status: 400 });
  const item = await prisma.download.create({
    data: { title: b.title.trim(), description: b.description || null, category: b.category?.trim() || "Chung", url: b.url.trim(), isActive: b.isActive ?? true, sortOrder: parseInt(b.sortOrder) || 0 },
  });
  return NextResponse.json({ success: true, data: item });
}
