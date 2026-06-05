import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySePayWebhook, parseDepositReference } from "@/lib/sepay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-sepay-signature") || "";

    // Verify signature
    if (process.env.SEPAY_WEBHOOK_SECRET) {
      const isValid = verifySePayWebhook(body, signature, process.env.SEPAY_WEBHOOK_SECRET);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);

    // Only process incoming transfers
    if (payload.transferType !== "in") {
      return NextResponse.json({ success: true });
    }

    const amount = payload.transferAmount;
    const content = payload.content || payload.description || "";
    const reference = payload.referenceCode;

    // Check duplicate
    const existing = await prisma.transaction.findFirst({
      where: { reference },
    });
    if (existing) {
      return NextResponse.json({ success: true });
    }

    // Parse user from content
    const userId = parseDepositReference(content);
    if (!userId) {
      console.log("Could not parse user from content:", content);
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log("User not found:", userId);
      return NextResponse.json({ success: true });
    }

    // Calculate bonus
    const bonuses = await prisma.depositBonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "desc" },
    });

    let bonusAmount = 0;
    for (const bonus of bonuses) {
      if (amount >= Number(bonus.minAmount)) {
        if (!bonus.maxAmount || amount <= Number(bonus.maxAmount)) {
          bonusAmount = Math.floor(amount * (Number(bonus.bonusPercent) / 100));
          break;
        }
      }
    }

    const totalCredit = amount + bonusAmount;
    const newBalance = Number(user.balance) + totalCredit;

    // Update balance & create transaction atomically
    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount,
          balanceBefore: Number(user.balance),
          balanceAfter: newBalance,
          description: `Nạp tiền qua ngân hàng${bonusAmount > 0 ? ` (bonus ${bonusAmount.toLocaleString("vi-VN")}đ)` : ""}`,
          reference,
          status: "COMPLETED",
          metadata: { raw: payload, bonusAmount },
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "PAYMENT",
          title: "Nạp tiền thành công",
          content: `Tài khoản được cộng ${totalCredit.toLocaleString("vi-VN")}đ${bonusAmount > 0 ? ` (bao gồm bonus ${bonusAmount.toLocaleString("vi-VN")}đ)` : ""}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SePay webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
