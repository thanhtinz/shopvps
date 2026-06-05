import { prisma } from "@/lib/prisma";

export type Currency = {
  code: string; name: string; symbol: string; rate: number;
  isBase: boolean; decimals: number; position: string;
};

// Used before any currency is configured in the DB.
export const FALLBACK_BASE: Currency = { code: "VND", name: "Việt Nam Đồng", symbol: "₫", rate: 1, isBase: true, decimals: 0, position: "after" };

function toC(r: any): Currency {
  return { code: r.code, name: r.name, symbol: r.symbol, rate: Number(r.rate), isBase: r.isBase, decimals: r.decimals, position: r.position };
}

export async function getActiveCurrencies(): Promise<Currency[]> {
  const rows = await prisma.currency.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return rows.length ? rows.map(toC) : [FALLBACK_BASE];
}

export async function getBaseCurrency(): Promise<Currency> {
  const row = await prisma.currency.findFirst({ where: { isBase: true } });
  return row ? toC(row) : FALLBACK_BASE;
}

export async function getCurrency(code: string): Promise<Currency | null> {
  if (!code) return null;
  const row = await prisma.currency.findUnique({ where: { code } });
  return row ? toC(row) : (code === FALLBACK_BASE.code ? FALLBACK_BASE : null);
}

/** Convert an amount in the given currency to base-currency units. */
export function toBase(amount: number, c: Currency): number {
  return Math.round(amount * (c.rate || 1));
}

/** Convert a base-currency amount into the given currency. */
export function fromBase(amountBase: number, c: Currency): number {
  const v = c.rate ? amountBase / c.rate : amountBase;
  return Number(v.toFixed(c.decimals));
}

export function formatMoney(amount: number, c: Currency): string {
  const n = amount.toLocaleString("en-US", { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  const sym = c.symbol || c.code;
  return c.position === "after" ? `${n} ${sym}` : `${sym}${n}`;
}
