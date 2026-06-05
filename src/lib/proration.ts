export const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

/**
 * Fraction (0..1) of the current billing term still remaining, based on the
 * expiry date and the cycle length.
 */
export function remainingFraction(billingCycle: string, expiresAt: Date | string | null): number {
  if (!expiresAt) return 0;
  const months = CYCLE_MONTHS[billingCycle] || 1;
  const cycleMs = months * 30 * 86400000;
  const remainMs = new Date(expiresAt).getTime() - Date.now();
  if (remainMs <= 0) return 0;
  return Math.min(1, remainMs / cycleMs);
}

/**
 * Prorated charge (positive) or refund (negative) for switching from the old
 * cycle price to a new one, charging only for the unused portion of the term.
 */
export function prorateChange(oldPrice: number, newPrice: number, billingCycle: string, expiresAt: Date | string | null): number {
  const frac = remainingFraction(billingCycle, expiresAt);
  return Math.round((newPrice - oldPrice) * frac);
}

/** Prorated refund (positive amount) for cancelling the unused portion of a term. */
export function prorateRefund(price: number, billingCycle: string, expiresAt: Date | string | null): number {
  const frac = remainingFraction(billingCycle, expiresAt);
  return Math.max(0, Math.round(price * frac));
}
