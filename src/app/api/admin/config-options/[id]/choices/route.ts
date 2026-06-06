import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.label) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const c = await prisma.configChoice.create({
    data: { optionId: (await params).id, label: String(b.label), priceMonthly: Number(b.priceMonthly) || 0, sortOrder: parseInt(b.sortOrder, 10) || 0 },
  });
  return NextResponse.json({ success: true, data: c });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const choiceId = new URL(req.url).searchParams.get("choiceId");
  if (choiceId) await prisma.configChoice.delete({ where: { id: choiceId } });
  return NextResponse.json({ success: true });
}
