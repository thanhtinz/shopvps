import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const category = (new URL(req.url).searchParams.get("category") || "").toUpperCase();
  const where: any = { userId: session.user.id };
  if (["DEDICATED", "PROXY", "CRONJOB"].includes(category)) where.category = category;
  const orders = await prisma.productOrder.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, category: true, specs: true } } },
  });
  return NextResponse.json({ success: true, data: orders });
}
