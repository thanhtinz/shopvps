import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [purchases, deposits, newUsers, monthAgg, totalAgg, vpsTop, hostingTop] = await Promise.all([
    prisma.transaction.findMany({ where: { type: "PURCHASE", status: "COMPLETED", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "COMPLETED", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "PURCHASE", status: "COMPLETED", createdAt: { gte: monthStart } } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "PURCHASE", status: "COMPLETED" } }),
    prisma.vpsOrder.groupBy({ by: ["packageId"], _count: { _all: true }, orderBy: { _count: { packageId: "desc" } }, take: 5 }),
    prisma.hostingOrder.groupBy({ by: ["packageId"], _count: { _all: true }, orderBy: { _count: { packageId: "desc" } }, take: 5 }),
  ]);

  // Build a zero-filled 30-day series, then bucket transactions/users into it.
  const buckets: Record<string, { revenue: number; deposits: number; newUsers: number }> = {};
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const k = dayKey(d);
    days.push(k);
    buckets[k] = { revenue: 0, deposits: 0, newUsers: 0 };
  }
  for (const t of purchases) { const b = buckets[dayKey(t.createdAt)]; if (b) b.revenue += Math.abs(Number(t.amount)); }
  for (const t of deposits) { const b = buckets[dayKey(t.createdAt)]; if (b) b.deposits += Math.abs(Number(t.amount)); }
  for (const u of newUsers) { const b = buckets[dayKey(u.createdAt)]; if (b) b.newUsers += 1; }
  const daily = days.map(date => ({ date, ...buckets[date] }));
  const todayRevenue = buckets[dayKey(now)]?.revenue || 0;

  // Resolve package names for the top lists.
  const vpsIds = vpsTop.map(p => p.packageId);
  const hostingIds = hostingTop.map(p => p.packageId);
  const [vpsPkgs, hostingPkgs] = await Promise.all([
    prisma.vpsPackage.findMany({ where: { id: { in: vpsIds } }, select: { id: true, name: true } }),
    prisma.hostingPackage.findMany({ where: { id: { in: hostingIds } }, select: { id: true, name: true } }),
  ]);
  const vpsName = Object.fromEntries(vpsPkgs.map(p => [p.id, p.name]));
  const hostingName = Object.fromEntries(hostingPkgs.map(p => [p.id, p.name]));
  const topPackages = [
    ...vpsTop.map(p => ({ name: vpsName[p.packageId] || "—", type: "VPS", count: p._count._all })),
    ...hostingTop.map(p => ({ name: hostingName[p.packageId] || "—", type: "Hosting", count: p._count._all })),
  ].sort((a, b) => b.count - a.count).slice(0, 6);

  return NextResponse.json({
    success: true,
    data: {
      daily,
      topPackages,
      todayRevenue,
      monthRevenue: Math.abs(Number(monthAgg._sum.amount || 0)),
      totalRevenue: Math.abs(Number(totalAgg._sum.amount || 0)),
    },
  });
}
