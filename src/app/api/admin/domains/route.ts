import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status");
  const where: any = status ? { status } : {};
  const [items, pending] = await Promise.all([
    prisma.domainOrder.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.domainOrder.count({ where: { status: "PENDING" } }),
  ]);
  return NextResponse.json({ success: true, data: { items, pending } });
}
