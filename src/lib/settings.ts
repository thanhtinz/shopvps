import { prisma } from "@/lib/prisma";

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Boolean setting flag, defaulting to `def` when unset. */
export async function isFlagOn(key: string, def = true): Promise<boolean> {
  const s = await getSettings([key]);
  return (s[key] ?? (def ? "true" : "false")) !== "false";
}

/** Configured VAT rate (percent) and label. Defaults to 0% (disabled). */
export async function getTaxConfig(): Promise<{ rate: number; label: string }> {
  const s = await getSettings(["tax_rate", "tax_label"]);
  const rate = Math.max(0, Math.min(100, parseFloat(s.tax_rate || "0") || 0));
  return { rate, label: s.tax_label || "VAT" };
}

/**
 * VAT amount embedded in a tax-inclusive total (the Vietnamese convention where
 * the displayed price already includes VAT). Returns 0 when the rate is 0.
 */
export function taxFromInclusive(total: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((total * rate) / (100 + rate));
}

export const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);

export interface ResolvedTax { rate: number; label: string; reverseCharge: boolean }

/**
 * Resolve the applicable tax for a customer: per-country TaxRule with a "*"
 * default, plus EU B2B reverse charge (0%) when the customer has a VAT ID and
 * is in a different EU country than the business.
 */
export async function resolveTax(ctx: { country?: string | null; taxId?: string | null }): Promise<ResolvedTax> {
  const country = (ctx.country || "").toUpperCase().trim();
  const s = await getSettings(["business_country", "eu_reverse_charge", "tax_rate", "tax_label"]);
  const businessCountry = (s.business_country || "").toUpperCase().trim();
  const reverseEnabled = (s.eu_reverse_charge ?? "true") !== "false";

  if (reverseEnabled && ctx.taxId && country && EU_COUNTRIES.has(country) && country !== businessCountry) {
    return { rate: 0, label: "Reverse charge", reverseCharge: true };
  }

  if (country) {
    const rule = await prisma.taxRule.findFirst({ where: { country, isActive: true } });
    if (rule) return { rate: clampRate(Number(rule.rate)), label: rule.label || "VAT", reverseCharge: false };
  }
  const def = await prisma.taxRule.findFirst({ where: { country: "*", isActive: true } });
  if (def) return { rate: clampRate(Number(def.rate)), label: def.label || "VAT", reverseCharge: false };

  return { rate: clampRate(parseFloat(s.tax_rate || "0") || 0), label: s.tax_label || "VAT", reverseCharge: false };
}

function clampRate(r: number): number { return Math.max(0, Math.min(100, r || 0)); }

/** Resolve tax for a specific user (loads their country + VAT ID). */
export async function getTaxForUser(userId: string): Promise<ResolvedTax> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true, taxId: true } });
  return resolveTax({ country: user?.country, taxId: user?.taxId });
}
