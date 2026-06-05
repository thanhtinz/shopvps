import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, referrals, commissions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { affiliateCode: true, affiliateBalance: true } }),
    prisma.affiliateReferral.findMany({ where: { referrerId: session.user.id }, include: { referred: { select: { name: true, email: true, createdAt: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.commission.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return NextResponse.json({ success: true, data: { affiliateCode: user?.affiliateCode, balance: user?.affiliateBalance, referrals, commissions } });
}
