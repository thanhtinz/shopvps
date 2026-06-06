import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }
const TYPES = ["EMAIL", "DOMAIN", "IP", "COUNTRY"];

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.blocklist.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type, value, reason } = await req.json();
  const tp = String(type || "").toUpperCase();
  let val = String(value || "").trim();
  if (!TYPES.includes(tp) || !val) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  val = tp === "COUNTRY" ? val.toUpperCase() : val.toLowerCase();
  try {
    const item = await prisma.blocklist.upsert({
      where: { type_value: { type: tp, value: val } },
      update: { reason: reason || null },
      create: { type: tp, value: val, reason: reason || null },
    });
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ error: t("Không thể lưu") }, { status: 500 });
  }
}
