import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const category = (new URL(req.url).searchParams.get("category") || "").toUpperCase();
  const where: any = {};
  if (["DEDICATED", "PROXY", "CRONJOB"].includes(category)) where.category = category;
  const orders = await prisma.productOrder.findMany({
    where, orderBy: { createdAt: "desc" }, take: 200,
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, category: true } } },
  });
  return NextResponse.json({ success: true, data: orders });
}
