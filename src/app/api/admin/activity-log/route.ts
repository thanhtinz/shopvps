import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const perPage = 30;
  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.activityLog.count({ where }),
  ]);
  return NextResponse.json({ success: true, data: { logs, total, totalPages: Math.ceil(total / perPage) } });
}
