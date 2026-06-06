import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const plans = await prisma.sslPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: plans });
}
