import { prisma } from "@/lib/prisma";
import type { GatewayModule } from "./types";
import { manualGateway } from "./manual";
import { sepayGateway } from "./sepay";
import { stripeGateway } from "./stripe";
import { paypalGateway } from "./paypal";

export const GATEWAYS: Record<string, GatewayModule> = {
  manual: manualGateway,
  sepay: sepayGateway,
  stripe: stripeGateway,
  paypal: paypalGateway,
};

export const GATEWAY_ORDER = ["sepay", "manual", "stripe", "paypal"];

export function getGateway(code: string): GatewayModule | null {
  return GATEWAYS[code] || null;
}

/** Create rows for the known gateways (inactive) on first use. */
export async function seedDefaultGateways() {
  const existing = await prisma.paymentGateway.findMany({ select: { code: true } });
  const have = new Set(existing.map((g) => g.code));
  let order = 0;
  for (const code of GATEWAY_ORDER) {
    const mod = GATEWAYS[code];
    if (!have.has(code)) {
      await prisma.paymentGateway.create({ data: { code, name: mod.label, isActive: false, config: "{}", sortOrder: order } });
    }
    order++;
  }
}

export function parseConfig(config: string | null): any {
  try { return config ? JSON.parse(config) : {}; } catch { return {}; }
}
