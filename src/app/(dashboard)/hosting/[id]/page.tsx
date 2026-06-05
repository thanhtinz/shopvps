import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import HostingDetailClient from "./HostingDetailClient";

export default async function HostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  // Select explicit fields — never expose cpanelPassword or WHM token to the client.
  const hosting = await prisma.hostingOrder.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true, domain: true, cpanelUsername: true, status: true, packageId: true, serverId: true,
      price: true, billingCycle: true, expiresAt: true, startDate: true,
      autoRenew: true, createdAt: true,
      package: { select: { name: true, storage: true, bandwidth: true, databases: true, emailAccounts: true, subdomains: true } },
      server: { select: { name: true, hostname: true } },
    },
  });
  if (!hosting) notFound();

  return <HostingDetailClient hosting={JSON.parse(JSON.stringify(hosting))} />;
}
