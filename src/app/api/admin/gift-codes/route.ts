import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

function genCode() {
  return "GIFT-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.giftCode.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const amount = parseFloat(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  const quantity = Math.max(1, Math.min(100, parseInt(b.quantity) || 1));
  const expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;

  const data = Array.from({ length: quantity }, () => ({ code: genCode(), amount, expiresAt }));
  await prisma.giftCode.createMany({ data, skipDuplicates: true });
  const created = await prisma.giftCode.findMany({ where: { code: { in: data.map((d) => d.code) } } });
  return NextResponse.json({ success: true, data: created });
}
