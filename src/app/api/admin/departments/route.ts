import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

const DEFAULTS = [
  { name: "Hỗ trợ kỹ thuật", sortOrder: 0 },
  { name: "Thanh toán", sortOrder: 1 },
  { name: "Kinh doanh", sortOrder: 2 },
];

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let items = await prisma.department.findMany({ orderBy: { sortOrder: "asc" } });
  if (items.length === 0) {
    await prisma.department.createMany({ data: DEFAULTS });
    items = await prisma.department.findMany({ orderBy: { sortOrder: "asc" } });
  }
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: t("Thiếu tên phòng ban") }, { status: 400 });
  const item = await prisma.department.create({ data: { name: b.name.trim(), sortOrder: parseInt(b.sortOrder) || 0 } });
  return NextResponse.json({ success: true, data: item });
}
