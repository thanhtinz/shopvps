import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import VpsDetailClient from "./VpsDetailClient";

export default async function VpsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const vps = await prisma.vpsOrder.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true, hostname: true, ipAddress: true, os: true, status: true,
      price: true, billingCycle: true, expiresAt: true, startDate: true,
      autoRenew: true, createdAt: true, providerVpsId: true, packageId: true,
      package: { select: { name: true, cpu: true, ram: true, storage: true, bandwidth: true } },
      provider: { select: { name: true } },
    },
  });
  if (!vps) notFound();

  return <VpsDetailClient vps={JSON.parse(JSON.stringify(vps))} />;
}
