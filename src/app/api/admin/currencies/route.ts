import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Seed a base currency on first use so the page is immediately usable.
  let items = await prisma.currency.findMany({ orderBy: { sortOrder: "asc" } });
  if (items.length === 0) {
    await prisma.currency.create({ data: { code: "VND", name: "Việt Nam Đồng", symbol: "₫", rate: 1, isBase: true, isActive: true, decimals: 0, position: "after" } });
    items = await prisma.currency.findMany({ orderBy: { sortOrder: "asc" } });
  }
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const code = String(b.code || "").trim().toUpperCase();
  if (!code || !b.name) return NextResponse.json({ error: t("Thiếu mã hoặc tên tiền tệ") }, { status: 400 });

  const isBase = !!b.isBase;
  const item = await prisma.$transaction(async (tx: any) => {
    if (isBase) await tx.currency.updateMany({ data: { isBase: false } });
    return tx.currency.create({
      data: {
        code, name: b.name, symbol: b.symbol || "",
        rate: isBase ? 1 : (parseFloat(b.rate) || 1),
        isBase, isActive: b.isActive ?? true,
        decimals: parseInt(b.decimals) || 0,
        position: b.position === "after" ? "after" : "before",
        sortOrder: parseInt(b.sortOrder) || 0,
      },
    });
  });
  return NextResponse.json({ success: true, data: item });
}
