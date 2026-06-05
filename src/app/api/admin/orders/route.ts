import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "vps";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  if (type === "vps") {
    const [items, total] = await Promise.all([
      prisma.vpsOrder.findMany({ include: { user: { select: { name: true, email: true } }, package: true, provider: true }, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
      prisma.vpsOrder.count(),
    ]);
    return NextResponse.json({ success: true, data: { items, total, totalPages: Math.ceil(total/perPage) } });
  } else {
    const [items, total] = await Promise.all([
      prisma.hostingOrder.findMany({ include: { user: { select: { name: true, email: true } }, package: true }, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
      prisma.hostingOrder.count(),
    ]);
    return NextResponse.json({ success: true, data: { items, total, totalPages: Math.ceil(total/perPage) } });
  }
}
