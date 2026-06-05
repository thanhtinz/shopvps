import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseConfig } from "@/lib/payments";
import { creditPendingDeposit } from "@/lib/payments/credit";

// Verify a Stripe webhook signature header ("t=...,v1=...").
function verify(rawBody: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const t = parts.t, sig = parts.v1;
  if (!t || !sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  const row = await prisma.paymentGateway.findUnique({ where: { code: "stripe" } });
  const cfg = parseConfig(row?.config || null);
  if (!cfg.webhookSecret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (!verify(raw, sig, cfg.webhookSecret)) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const s = event.data?.object || {};
    const reference = s.client_reference_id || s.metadata?.reference;
    if (reference && (s.payment_status === "paid" || s.status === "complete")) {
      await creditPendingDeposit(reference);
    }
  }
  return NextResponse.json({ received: true });
}
