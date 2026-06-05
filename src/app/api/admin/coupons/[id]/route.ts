import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";

const COUPON_FIELDS = [
  "code", "type", "value", "minOrder", "maxDiscount", "usageLimit", "isActive", "expiresAt",
] as const;

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const data = pick(body, COUPON_FIELDS);
  if (typeof data.code === "string") data.code = data.code.toUpperCase();
  if ("expiresAt" in data) data.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  const coupon = await prisma.coupon.update({ where: { id: (await params).id }, data: data as any });
  return NextResponse.json({ success: true, data: coupon });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.coupon.update({ where: { id: (await params).id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
