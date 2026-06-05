import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;
  const [items, total] = await Promise.all([
    prisma.invoice.findMany({ where: { userId: session.user.id }, include: { items: true }, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
    prisma.invoice.count({ where: { userId: session.user.id } }),
  ]);
  return NextResponse.json({ success: true, data: { items, total, totalPages: Math.ceil(total/perPage) } });
}
