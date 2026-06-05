import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: t("Số tiền không hợp lệ") }, { status: 400 });

  try {
    await prisma.$transaction(async (tx: any) => {
      // Atomic, race-safe move from affiliate balance to main balance.
      const moved = await tx.user.updateMany({
        where: { id: session.user.id, affiliateBalance: { gte: amount } },
        data: {
          affiliateBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });
      if (moved.count === 0) throw new Error("INSUFFICIENT_BALANCE");

      const fresh = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
      });
      const balanceAfter = Number(fresh!.balance);

      await tx.transaction.create({
        data: {
          userId: session.user.id, type: "COMMISSION", amount,
          balanceBefore: balanceAfter - amount,
          balanceAfter,
          description: "Rút hoa hồng về ví chính", status: "COMPLETED",
        },
      });
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE")
      return NextResponse.json({ error: t("Số dư hoa hồng không đủ") }, { status: 400 });
    console.error("withdraw-affiliate error:", e);
    return NextResponse.json({ error: t("Không thể rút hoa hồng") }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Đã chuyển ${amount.toLocaleString("vi-VN")}đ vào ví chính` });
}
