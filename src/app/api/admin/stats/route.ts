import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, activeVps, activeHosting, pendingTickets, todayRevenue, totalBalance] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.vpsOrder.count({ where: { status: "ACTIVE" } }),
    prisma.hostingOrder.count({ where: { status: "ACTIVE" } }),
    prisma.ticket.count({ where: { status: { not: "CLOSED" } } }),
    prisma.transaction.aggregate({ where: { type: "DEPOSIT", status: "COMPLETED", createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }, _sum: { amount: true } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
  ]);

  return NextResponse.json({ success: true, data: { totalUsers, activeVps, activeHosting, pendingTickets, todayRevenue: Number(todayRevenue._sum.amount || 0), totalBalance: Number(totalBalance._sum.balance || 0) } });
}
