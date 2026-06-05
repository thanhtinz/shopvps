import { auth } from "@/lib/auth";


import { prisma } from "@/lib/prisma";
import VpsClient from "./VpsClient";

export default async function VpsPage() {
  const session = await auth();
  if (!session) return null;

  const orders = await prisma.vpsOrder.findMany({
    where: { userId: session.user.id },
    include: { package: true, provider: true },
    orderBy: { createdAt: "desc" },
  });

  return <VpsClient orders={JSON.parse(JSON.stringify(orders))} />;
}
