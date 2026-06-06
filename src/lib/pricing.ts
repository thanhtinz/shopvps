import { prisma } from "@/lib/prisma";

export type PriceScope = "product" | "vps" | "hosting";

export interface TierInfo {
  id: string | null;
  name: string;
  discountPercent: number;
  isReseller: boolean;
}

const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

/** The user's assigned tier, or the default tier, or a zero-discount fallback. */
export async function getUserTier(userId: string | null): Promise<TierInfo> {
  let tier: any = null;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
    tier = u?.tier || null;
  }
  if (!tier) tier = await prisma.priceTier.findFirst({ where: { isDefault: true } });
  if (!tier) return { id: null, name: "Standard", discountPercent: 0, isReseller: false };
  return { id: tier.id, name: tier.name, discountPercent: Number(tier.discountPercent) || 0, isReseller: !!tier.isReseller };
}

/**
 * Effective monthly/yearly price for a catalogue item under a tier: a custom
 * TierPrice override wins, otherwise the base price gets the tier's percentage
 * discount. Returns the base prices unchanged for the no-tier case.
 */
export async function resolveTierPrice(
  tier: TierInfo, scope: PriceScope, refId: string, baseMonthly: number, baseYearly: number | null,
): Promise<{ monthly: number; yearly: number | null }> {
  if (!tier.id) return { monthly: baseMonthly, yearly: baseYearly };

  const custom = await prisma.tierPrice.findUnique({ where: { tierId_scope_refId: { tierId: tier.id, scope, refId } } });
  if (custom) return { monthly: Number(custom.priceMonthly), yearly: custom.priceYearly != null ? Number(custom.priceYearly) : baseYearly };

  const f = 1 - tier.discountPercent / 100;
  return {
    monthly: Math.round(baseMonthly * f),
    yearly: baseYearly != null ? Math.round(baseYearly * f) : null,
  };
}

/** Per-cycle price from effective monthly/yearly (yearly wins for ANNUAL). */
export function cyclePriceFrom(monthly: number, yearly: number | null, cycle: string): number {
  const months = CYCLE_MONTHS[cycle] || 1;
  if (cycle === "ANNUAL" && yearly) return yearly;
  return monthly * months;
}

/** Convenience: tier-adjusted per-cycle price for an item. */
export async function tierCyclePrice(
  tier: TierInfo, scope: PriceScope, refId: string, baseMonthly: number, baseYearly: number | null, cycle: string,
): Promise<number> {
  const eff = await resolveTierPrice(tier, scope, refId, baseMonthly, baseYearly);
  return cyclePriceFrom(eff.monthly, eff.yearly, cycle);
}
