import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCurrencies, getBaseCurrency } from "@/lib/currency";

// Active gateways + currencies for the deposit UI.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows, currencies, base, user] = await Promise.all([
    prisma.paymentGateway.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getActiveCurrencies(),
    getBaseCurrency(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { preferredCurrency: true } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      gateways: rows.map((g) => ({ code: g.code, name: g.name })),
      currencies,
      base: base.code,
      preferred: user?.preferredCurrency || base.code,
    },
  });
}
