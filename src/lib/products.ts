import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { CYCLE_MONTHS } from "@/lib/utils";

export const PRODUCT_CATEGORIES = ["DEDICATED", "PROXY", "CRONJOB"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Vietnamese display labels (run through t() at render where shown). */
export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  DEDICATED: "Máy chủ vật lý",
  PROXY: "Proxy",
  CRONJOB: "Cronjob",
};

/** Settings flag controlling whether a category is offered for sale. */
export const CATEGORY_SETTING: Record<ProductCategory, string> = {
  DEDICATED: "sell_dedicated",
  PROXY: "sell_proxy",
  CRONJOB: "sell_cronjob",
};

/** Categories that are provisioned by an admin (vs. activated automatically). */
export const MANUAL_CATEGORIES: ProductCategory[] = ["DEDICATED", "PROXY"];

export function isProductCategory(v: any): v is ProductCategory {
  return PRODUCT_CATEGORIES.includes(v);
}

/** Per-cycle price for a product (yearly price wins for ANNUAL when set). */
export function cyclePrice(p: { priceMonthly: any; priceYearly: any }, cycle: string): number {
  const months = CYCLE_MONTHS[cycle] || 1;
  if (cycle === "ANNUAL" && p.priceYearly) return Number(p.priceYearly);
  return Number(p.priceMonthly) * months;
}

/** Whether a category is currently sellable (default on). */
export async function isCategorySellable(cat: ProductCategory): Promise<boolean> {
  const s = await getSettings([CATEGORY_SETTING[cat]]);
  return (s[CATEGORY_SETTING[cat]] ?? "true") !== "false";
}

/** The on/off map for every sellable category (including the legacy ones). */
export async function getCatalogToggles(): Promise<Record<string, boolean>> {
  const keys = ["sell_vps", "sell_hosting", "sell_domain", "sell_dedicated", "sell_proxy", "sell_cronjob"];
  const s = await getSettings(keys);
  return Object.fromEntries(keys.map((k) => [k, (s[k] ?? "true") !== "false"]));
}

/** Max number of cronjobs allowed by a cronjob order's product specs. */
export function cronjobLimit(specs: any): number {
  const n = parseInt(specs?.maxJobs ?? specs?.jobs ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}
