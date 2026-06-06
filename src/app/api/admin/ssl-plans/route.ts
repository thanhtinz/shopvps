import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";
async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ success: true, data: await prisma.sslPlan.findMany({ orderBy: { sortOrder: "asc" } }) });
}
export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name || b.price == null) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const plan = await prisma.sslPlan.create({ data: {
    name: String(b.name), brand: b.brand || null, type: ["DV","OV","EV"].includes(b.type) ? b.type : "DV",
    wildcard: !!b.wildcard, years: parseInt(b.years, 10) || 1, price: Number(b.price) || 0,
    isActive: b.isActive !== false, sortOrder: parseInt(b.sortOrder, 10) || 0,
  } });
  return NextResponse.json({ success: true, data: plan });
}
