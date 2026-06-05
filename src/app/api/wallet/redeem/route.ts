import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await req.json();
  const c = String(code || "").trim().toUpperCase();
  if (!c) return NextResponse.json({ error: "Vui lòng nhập mã" }, { status: 400 });

  try {
    const amount = await prisma.$transaction(async (tx: any) => {
      // Atomically claim the code (prevents double-redeem under concurrency).
      const claimed = await tx.giftCode.updateMany({
        where: { code: c, isActive: true, redeemedBy: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        data: { redeemedBy: session.user.id, redeemedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error("INVALID");

      const gift = await tx.giftCode.findUnique({ where: { code: c } });
      const amt = Number(gift!.amount);
      const updated = await tx.user.update({ where: { id: session.user.id }, data: { balance: { increment: amt } } });
      const balanceAfter = Number(updated.balance);
      await tx.transaction.create({
        data: { userId: session.user.id, type: "BONUS", amount: amt, balanceBefore: balanceAfter - amt, balanceAfter, description: `Đổi mã quà tặng ${c}`, status: "COMPLETED" },
      });
      return amt;
    });
    return NextResponse.json({ success: true, data: { amount }, message: `Đã cộng ${amount.toLocaleString("vi-VN")}đ vào ví.` });
  } catch (e: any) {
    if (e?.message === "INVALID") return NextResponse.json({ error: "Mã không hợp lệ, đã dùng hoặc hết hạn" }, { status: 400 });
    return NextResponse.json({ error: "Không thể đổi mã" }, { status: 500 });
  }
}
