import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Active add-ons available for a given product scope (vps | hosting).
export async function GET(req: NextRequest) {
  const scope = new URL(req.url).searchParams.get("scope");
  const where: any = { isActive: true };
  if (scope === "vps" || scope === "hosting") where.scope = { in: [scope, "both"] };
  const items = await prisma.addon.findMany({ where, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: items });
}
