import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const keys = await prisma.apiKey.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: keys });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, name, permissions } = await req.json();
  if (!userId || !name) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const key = "sk_" + crypto.randomBytes(24).toString("hex");
  const apiKey = await prisma.apiKey.create({
    data: { userId, name, key, permissions: permissions || [], isActive: true },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ success: true, data: apiKey });
}
