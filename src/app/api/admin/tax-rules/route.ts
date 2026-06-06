import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rules = await prisma.taxRule.findMany({ orderBy: { country: "asc" } });
  return NextResponse.json({ success: true, data: rules });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { country, label, rate } = await req.json();
  const code = String(country || "").toUpperCase().trim();
  if (!code) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const r = Math.max(0, Math.min(100, parseFloat(rate) || 0));
  try {
    const rule = await prisma.taxRule.upsert({
      where: { country: code },
      update: { label: label || "VAT", rate: r },
      create: { country: code, label: label || "VAT", rate: r },
    });
    return NextResponse.json({ success: true, data: rule });
  } catch {
    return NextResponse.json({ error: t("Không thể lưu") }, { status: 500 });
  }
}
