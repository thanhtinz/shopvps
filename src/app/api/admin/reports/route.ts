import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const months = Math.min(24, Math.max(3, parseInt(new URL(req.url).searchParams.get("months") || "12")));
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const recurring = { where: { status: "ACTIVE" as any }, select: { price: true, billingCycle: true } };
  const [purchases, deposits, refunds, users, invoices, vpsActive, hostingActive, domainActive, vpsNew, hostingNew, domainNew, churn, vpsRec, hostingRec, productRec] = await Promise.all([
    prisma.transaction.findMany({ where: { type: "PURCHASE", status: "COMPLETED", createdAt: { gte: start } }, select: { amount: true, createdAt: true, userId: true } }),
    prisma.transaction.findMany({ where: { type: "DEPOSIT", status: "COMPLETED", createdAt: { gte: start } }, select: { amount: true, createdAt: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "REFUND", status: "COMPLETED", createdAt: { gte: start } } }),
    prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.invoice.findMany({ where: { createdAt: { gte: start } }, select: { tax: true, total: true } }),
    prisma.vpsOrder.count({ where: { status: "ACTIVE" } }),
    prisma.hostingOrder.count({ where: { status: "ACTIVE" } }),
    prisma.domainOrder.count({ where: { status: "ACTIVE" } }),
    prisma.vpsOrder.count({ where: { createdAt: { gte: start } } }),
    prisma.hostingOrder.count({ where: { createdAt: { gte: start } } }),
    prisma.domainOrder.count({ where: { createdAt: { gte: start } } }),
    prisma.serviceRequest.count({ where: { type: "CANCEL", status: "COMPLETED", createdAt: { gte: start } } }),
    prisma.vpsOrder.findMany(recurring),
    prisma.hostingOrder.findMany(recurring),
    prisma.productOrder.findMany(recurring),
  ]);

  // MRR: normalise every active recurring service's price to a monthly figure.
  const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
  const toMonthly = (rows: { price: any; billingCycle: string }[]) =>
    rows.reduce((s, r) => s + Number(r.price) / (CYCLE_MONTHS[r.billingCycle] || 1), 0);
  const mrr = toMonthly(vpsRec) + toMonthly(hostingRec) + toMonthly(productRec);

  // Monthly series (zero-filled).
  const keys: string[] = [];
  const buckets: Record<string, { revenue: number; deposits: number; newUsers: number }> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const k = monthKey(d); keys.push(k); buckets[k] = { revenue: 0, deposits: 0, newUsers: 0 };
  }
  for (const t of purchases) { const b = buckets[monthKey(t.createdAt)]; if (b) b.revenue += Math.abs(Number(t.amount)); }
  for (const t of deposits) { const b = buckets[monthKey(t.createdAt)]; if (b) b.deposits += Math.abs(Number(t.amount)); }
  for (const u of users) { const b = buckets[monthKey(u.createdAt)]; if (b) b.newUsers += 1; }
  const monthly = keys.map((k) => ({ month: k, ...buckets[k] }));

  // Top customers by spend.
  const spend: Record<string, number> = {};
  for (const t of purchases) spend[t.userId] = (spend[t.userId] || 0) + Math.abs(Number(t.amount));
  const topIds = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topUsers = await prisma.user.findMany({ where: { id: { in: topIds.map((x) => x[0]) } }, select: { id: true, name: true, email: true } });
  const nameOf = Object.fromEntries(topUsers.map((u) => [u.id, u]));
  const topCustomers = topIds.map(([id, total]) => ({ name: nameOf[id]?.name || "—", email: nameOf[id]?.email || "", total }));

  const totalRevenue = purchases.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalDeposits = deposits.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const vatCollected = invoices.reduce((s, i) => s + Number(i.tax || 0), 0);
  const orderCount = vpsNew + hostingNew + domainNew;
  const activeTotal = vpsActive + hostingActive + domainActive;
  const payingUsers = new Set(purchases.map((t) => t.userId)).size;
  const churnRate = activeTotal + churn > 0 ? (churn / (activeTotal + churn)) * 100 : 0;
  const arpu = payingUsers ? totalRevenue / payingUsers : 0;

  return NextResponse.json({
    success: true,
    data: {
      months,
      monthly,
      topCustomers,
      totals: {
        revenue: totalRevenue,
        deposits: totalDeposits,
        refunds: Number(refunds._sum.amount || 0),
        vatCollected,
        newUsers: users.length,
        churn,
        avgOrderValue: orderCount ? Math.round(totalRevenue / orderCount) : 0,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
        churnRate: Math.round(churnRate * 10) / 10,
        arpu: Math.round(arpu),
        payingUsers,
      },
      activeServices: { vps: vpsActive, hosting: hostingActive, domain: domainActive },
      newOrders: { vps: vpsNew, hosting: hostingNew, domain: domainNew },
    },
  });
}
