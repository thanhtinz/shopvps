import { auth } from "@/lib/auth";


import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";
import DashboardClient from "./DashboardClient";

async function getDashboardData(userId: string) {
  const [user, vpsCount, hostingCount, recentTx, openTickets] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true, name: true, affiliateBalance: true } }),
    prisma.vpsOrder.count({ where: { userId, status: "ACTIVE" } }),
    prisma.hostingOrder.count({ where: { userId, status: "ACTIVE" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.ticket.count({ where: { userId, status: { not: "CLOSED" } } }),
  ]);
  return { user, vpsCount, hostingCount, recentTx, openTickets };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getDashboardData(session.user.id);
  const { t } = await getServerT();
  return <DashboardClient data={data} userName={session.user.name || t("bạn")} />;
}
