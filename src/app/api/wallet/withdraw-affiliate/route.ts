import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || Number(user.affiliateBalance) < amount)
    return NextResponse.json({ error: "Số dư hoa hồng không đủ" }, { status: 400 });

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        affiliateBalance: { decrement: amount },
        balance: { increment: amount },
      },
    });
    await tx.transaction.create({
      data: {
        userId: session.user.id, type: "COMMISSION", amount,
        balanceBefore: Number(user.balance),
        balanceAfter: Number(user.balance) + amount,
        description: "Rút hoa hồng về ví chính", status: "COMPLETED",
      },
    });
  });

  return NextResponse.json({ success: true, message: `Đã chuyển ${amount.toLocaleString("vi-VN")}đ vào ví chính` });
}
