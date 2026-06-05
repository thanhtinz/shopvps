import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [services, incidents] = await Promise.all([
    prisma.serviceStatus.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.serviceIncident.findMany({
      where: { status: { not: "RESOLVED" } },
      include: { service: true, updates: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return NextResponse.json({ success: true, data: { services, incidents } });
}
