import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.kbCategory.findMany({
    include: { articles: { orderBy: { createdAt: "desc" } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, icon, order } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: t("Thiếu tên danh mục") }, { status: 400 });
  const item = await prisma.kbCategory.create({
    data: { name: name.trim(), slug: slugify(name), icon: icon || null, order: order ?? 0 },
  });
  return NextResponse.json({ success: true, data: item });
}
