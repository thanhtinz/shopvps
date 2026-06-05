import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.hostingPackage.findMany({
    where: { isActive: true },
    include: { server: { select: { id: true, name: true } } },
    orderBy: { priceMonthly: "asc" },
  });
  return NextResponse.json({ success: true, data: packages });
}
