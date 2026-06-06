import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status");
  const where: any = {};
  if (status && ["PENDING", "PAID", "REJECTED"].includes(status)) where.status = status;
  const payouts = await prisma.payout.findMany({
    where, orderBy: { createdAt: "desc" }, take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ success: true, data: payouts });
}
