import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

const DEFAULTS = [
  { tld: ".com", registerPrice: 300000, renewPrice: 320000, transferPrice: 300000, sortOrder: 0 },
  { tld: ".net", registerPrice: 350000, renewPrice: 370000, transferPrice: 350000, sortOrder: 1 },
  { tld: ".vn", registerPrice: 480000, renewPrice: 480000, transferPrice: 0, sortOrder: 2 },
  { tld: ".com.vn", registerPrice: 350000, renewPrice: 350000, transferPrice: 0, sortOrder: 3 },
  { tld: ".org", registerPrice: 320000, renewPrice: 340000, transferPrice: 320000, sortOrder: 4 },
  { tld: ".xyz", registerPrice: 60000, renewPrice: 250000, transferPrice: 60000, sortOrder: 5 },
];

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let items = await prisma.tld.findMany({ orderBy: { sortOrder: "asc" } });
  if (items.length === 0) {
    await prisma.tld.createMany({ data: DEFAULTS });
    items = await prisma.tld.findMany({ orderBy: { sortOrder: "asc" } });
  }
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  let tld = String(b.tld || "").trim().toLowerCase();
  if (!tld) return NextResponse.json({ error: t("Thiếu đuôi tên miền") }, { status: 400 });
  if (!tld.startsWith(".")) tld = "." + tld;
  const item = await prisma.tld.create({
    data: {
      tld,
      registerPrice: parseFloat(b.registerPrice) || 0,
      renewPrice: parseFloat(b.renewPrice) || 0,
      transferPrice: parseFloat(b.transferPrice) || 0,
      isActive: b.isActive ?? true,
      sortOrder: parseInt(b.sortOrder) || 0,
    },
  });
  return NextResponse.json({ success: true, data: item });
}
