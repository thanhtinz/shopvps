import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePaymentContent } from "@/services/payment/sepay";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true, id: true },
  });

  const banks = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const bonusTiers = await prisma.depositBonus.findMany({
    where: { isActive: true },
    orderBy: { minAmount: "asc" },
  });

  return NextResponse.json({
    balance: user?.walletBalance,
    paymentContent: generatePaymentContent(session.user.id),
    banks,
    bonusTiers,
  });
}
