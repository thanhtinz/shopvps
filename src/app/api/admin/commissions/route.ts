import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status");
  const perPage = 30;
  const where: any = status ? { status } : {};

  const [items, total, pendingTotal] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.commission.count({ where }),
    prisma.commission.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { items, total, totalPages: Math.ceil(total / perPage), pendingTotal: Number(pendingTotal._sum.amount || 0) },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action))
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) return NextResponse.json({ error: "Không tìm thấy hoa hồng" }, { status: 404 });
  if (commission.status !== "PENDING")
    return NextResponse.json({ error: "Hoa hồng đã được xử lý" }, { status: 400 });

  if (action === "approve") {
    await prisma.$transaction(async (tx: any) => {
      // Guard against double-approval racing two admins.
      const updated = await tx.commission.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (updated.count === 0) throw new Error("ALREADY_PROCESSED");

      await tx.user.update({
        where: { id: commission.userId },
        data: { affiliateBalance: { increment: commission.amount } },
      });

      await tx.notification.create({
        data: {
          userId: commission.userId,
          type: "PAYMENT",
          title: "Hoa hồng đã được duyệt",
          content: `Bạn nhận được ${Number(commission.amount).toLocaleString("vi-VN")}đ hoa hồng giới thiệu.`,
        },
      });
    }).catch((e: any) => {
      if (e?.message === "ALREADY_PROCESSED") return;
      throw e;
    });
  } else {
    await prisma.commission.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ success: true });
}
