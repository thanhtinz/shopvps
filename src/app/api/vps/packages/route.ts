import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.vpsPackage.findMany({
    where: { isActive: true },
    include: { provider: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ provider: { name: "asc" } }, { priceMonthly: "asc" }],
  });
  return NextResponse.json({ success: true, data: packages });
}
