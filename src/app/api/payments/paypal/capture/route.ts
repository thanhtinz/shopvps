import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseConfig } from "@/lib/payments";
import { paypalBase, paypalToken } from "@/lib/payments/paypal";
import { creditPendingDeposit } from "@/lib/payments/credit";

// PayPal return URL: capture the approved order, then credit the deposit.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const orderId = new URL(req.url).searchParams.get("token");
  if (!orderId) return NextResponse.redirect(`${appUrl}/wallet?deposit=cancel`);

  try {
    const row = await prisma.paymentGateway.findUnique({ where: { code: "paypal" } });
    const cfg = parseConfig(row?.config || null);
    const base = paypalBase(cfg);
    const token = await paypalToken(cfg);
    const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    const status = data?.status;
    const reference = data?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
      || data?.purchase_units?.[0]?.custom_id;
    if (status === "COMPLETED" && reference) {
      await creditPendingDeposit(reference);
      return NextResponse.redirect(`${appUrl}/wallet?deposit=success`);
    }
  } catch (e) {
    console.error("paypal capture error:", e);
  }
  return NextResponse.redirect(`${appUrl}/wallet?deposit=cancel`);
}
