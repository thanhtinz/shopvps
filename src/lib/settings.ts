import { prisma } from "@/lib/prisma";

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
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
