import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const type = searchParams.get("type");
  const perPage = 30;
  const where: any = type ? { type } : {};
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
    prisma.transaction.count({ where }),
  ]);
  return NextResponse.json({ success: true, data: { items, total, totalPages: Math.ceil(total/perPage) } });
}
