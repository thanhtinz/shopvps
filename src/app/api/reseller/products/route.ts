import { authReseller, unauthorized } from "@/lib/reseller";
import { prisma } from "@/lib/prisma";
import { getUserTier, resolveTierPrice } from "@/lib/pricing";
import { isGroupSellable } from "@/lib/products";

export async function GET(req: Request) {
  const a = await authReseller(req);
  if (!a) return unauthorized();
  const group = new URL(req.url).searchParams.get("group") || undefined;
  const tier = await getUserTier(a.userId);

  const products = await prisma.product.findMany({ where: { isActive: true, ...(group ? { group } : {}) }, orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  const out = [];
  for (const p of products) {
    if (!(await isGroupSellable(p.group))) continue;
    const eff = await resolveTierPrice(tier, "product", p.id, Number(p.priceMonthly), p.priceYearly != null ? Number(p.priceYearly) : null);
    out.push({ id: p.id, group: p.group, category: p.category, name: p.name, description: p.description, specs: p.specs, stock: p.stock, setupFee: Number(p.setupFee), priceMonthly: eff.monthly, priceYearly: eff.yearly, listPriceMonthly: Number(p.priceMonthly) });
  }
  return Response.json({ success: true, data: out });
}
