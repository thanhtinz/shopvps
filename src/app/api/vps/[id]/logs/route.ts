import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vps = await prisma.vpsOrder.findFirst({ where: { id: (await params).id, userId: session.user.id } });
  if (!vps) return NextResponse.json({ error: t("VPS không tồn tại") }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const action = searchParams.get("action");
  const perPage = 20;

  const where: any = { vpsOrderId: (await params).id };
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.vpsLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.vpsLog.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { logs, total, totalPages: Math.ceil(total / perPage) } });
}
