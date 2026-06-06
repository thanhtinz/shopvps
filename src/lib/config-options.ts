import { prisma } from "@/lib/prisma";

// Configurable options (WHMCS-style): grouped add-ons the customer picks at order
// time, each adding a recurring price. Scopes: product | vps | hosting | global.
// For a given item we surface: global options + scope-wide options + the item's
// own options.

export async function optionsForScope(scope: string, refId: string | null) {
  return prisma.configOption.findMany({
    where: {
      isActive: true,
      OR: [
        { scope: "global", refId: null },
        { scope, refId: null },
        ...(refId ? [{ scope, refId }] : []),
      ],
    },
    orderBy: { sortOrder: "asc" },
    include: { choices: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function optionsForProduct(productId: string) {
  return optionsForScope("product", productId);
}

export interface ResolvedChoice { id: string; label: string; priceMonthly: number }

/**
 * Validate selected choice ids against an item's options; return the chosen ids,
 * their summed monthly price, and the resolved choices (label + price). Throws
 * `REQUIRED_OPTION:<name>` when a required option has no selection.
 */
export async function resolveScopedChoices(scope: string, refId: string | null, choiceIds: string[]): Promise<{ choiceIds: string[]; monthly: number; items: ResolvedChoice[] }> {
  const options = await optionsForScope(scope, refId);
  const validIds = new Set(options.flatMap((o) => o.choices.map((c) => c.id)));
  const chosen = (Array.isArray(choiceIds) ? choiceIds : []).filter((id) => validIds.has(id));
  for (const o of options) {
    if (o.required && !o.choices.some((c) => chosen.includes(c.id))) throw new Error(`REQUIRED_OPTION:${o.name}`);
    // At most one choice per select option — keep the first selected.
    if (o.type === "select") {
      const picks = o.choices.filter((c) => chosen.includes(c.id));
      for (const p of picks.slice(1)) chosen.splice(chosen.indexOf(p.id), 1);
    }
  }
  const items: ResolvedChoice[] = options
    .flatMap((o) => o.choices)
    .filter((c) => chosen.includes(c.id))
    .map((c) => ({ id: c.id, label: c.label, priceMonthly: Number(c.priceMonthly) }));
  const monthly = items.reduce((s, c) => s + c.priceMonthly, 0);
  return { choiceIds: chosen, monthly, items };
}

/** Backwards-compatible product resolver (used by the generic product order). */
export async function resolveChoices(productId: string, choiceIds: string[]): Promise<{ choiceIds: string[]; monthly: number }> {
  const { choiceIds: ids, monthly } = await resolveScopedChoices("product", productId, choiceIds);
  return { choiceIds: ids, monthly };
}
