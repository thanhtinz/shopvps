import { prisma } from "@/lib/prisma";

// Configurable options (WHMCS-style): per-product or global add-ons the customer
// picks at order time, each adding a recurring price.

export async function optionsForProduct(productId: string) {
  return prisma.configOption.findMany({
    where: { isActive: true, OR: [{ scope: "product", refId: productId }, { scope: "global", refId: null }] },
    orderBy: { sortOrder: "asc" },
    include: { choices: { orderBy: { sortOrder: "asc" } } },
  });
}

/** Validate selected choice ids against a product's options; return the chosen
 *  choices + their summed monthly price. Throws on a missing required option. */
export async function resolveChoices(productId: string, choiceIds: string[]): Promise<{ choiceIds: string[]; monthly: number }> {
  const options = await optionsForProduct(productId);
  const validIds = new Set(options.flatMap((o) => o.choices.map((c) => c.id)));
  const chosen = (Array.isArray(choiceIds) ? choiceIds : []).filter((id) => validIds.has(id));
  // Enforce required options have a selection.
  for (const o of options) {
    if (o.required && !o.choices.some((c) => chosen.includes(c.id))) throw new Error(`REQUIRED_OPTION:${o.name}`);
    // At most one choice per select option.
    if (o.type === "select") {
      const picks = o.choices.filter((c) => chosen.includes(c.id));
      if (picks.length > 1) { const keep = picks[0].id; for (const p of picks.slice(1)) chosen.splice(chosen.indexOf(p.id), 1); void keep; }
    }
  }
  const monthly = options
    .flatMap((o) => o.choices)
    .filter((c) => chosen.includes(c.id))
    .reduce((s, c) => s + Number(c.priceMonthly), 0);
  return { choiceIds: chosen, monthly };
}
