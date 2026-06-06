import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySePayWebhook, parseDepositReference } from "@/lib/sepay";
import { getUserT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-sepay-signature") || "";

    // Verify signature — required. Refuse to process unsigned/misconfigured calls.
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("SePay webhook: SEPAY_WEBHOOK_SECRET not configured — rejecting");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    if (!verifySePayWebhook(body, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Only process incoming transfers
    if (payload.transferType !== "in") {
      return NextResponse.json({ success: true });
    }

    const amount = Number(payload.transferAmount);
    const content = payload.content || payload.description || "";
    const reference = payload.referenceCode;

    // Guard against a missing/non-numeric amount (would otherwise credit NaN).
    if (!Number.isFinite(amount) || amount <= 0) {
      console.error("SePay webhook: invalid transferAmount:", payload.transferAmount);
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

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

    // Update balance & create transaction atomically. The balance is
    // incremented atomically (not read-modify-write) to stay correct under
    // concurrent webhooks.
    const { t } = await getUserT(userId);
    await prisma.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: totalCredit } },
        select: { balance: true },
      });
      const balanceAfter = Number(updated.balance);

      await tx.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount,
          balanceBefore: balanceAfter - totalCredit,
          balanceAfter,
          description: `${t("Nạp tiền qua ngân hàng")}${bonusAmount > 0 ? ` (bonus ${bonusAmount.toLocaleString("vi-VN")}đ)` : ""}`,
          reference,
          status: "COMPLETED",
          metadata: { raw: payload, bonusAmount },
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "PAYMENT",
          title: t("Nạp tiền thành công"),
          content: `${t("Tài khoản được cộng")} ${totalCredit.toLocaleString("vi-VN")}đ${bonusAmount > 0 ? ` (${t("bao gồm bonus")} ${bonusAmount.toLocaleString("vi-VN")}đ)` : ""}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Unique-constraint collision on `reference` => already processed (race).
    if (error?.code === "P2002") {
      return NextResponse.json({ success: true });
    }
    console.error("SePay webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
