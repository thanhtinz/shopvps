import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";
import { generateVietQRUrl } from "@/lib/sepay";
import { getServerT } from "@/lib/i18n/server";

export async function GET(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const amount = parseInt(searchParams.get("amount") || "0");

  const bank = await prisma.bankAccount.findFirst({ where: { isActive: true, isPrimary: true } });
  if (!bank) return NextResponse.json({ error: t("Không có tài khoản ngân hàng") }, { status: 404 });

  const description = `SHOPVPS ${session.user.id}`;
  const qrUrl = amount > 0
    ? generateVietQRUrl({
        bankCode: bank.bankCode,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        amount,
        description,
      })
    : null;

  const bonuses = await prisma.depositBonus.findMany({
    where: { isActive: true },
    orderBy: { minAmount: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: { bank, description, qrUrl, bonuses },
  });
}
