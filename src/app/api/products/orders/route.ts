import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const where: any = { userId: session.user.id };
  if (sp.get("group")) where.group = sp.get("group");
  if (sp.get("category")) where.category = sp.get("category");
  const orders = await prisma.productOrder.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, category: true, group: true, specs: true } } },
  });
  return NextResponse.json({ success: true, data: orders });
}
