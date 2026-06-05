import { prisma } from "@/lib/prisma";

/** Match the longest active TLD that the domain ends with (handles .co.uk). */
export async function resolveTld(domain: string) {
  const d = domain.toLowerCase().trim();
  const tlds = await prisma.tld.findMany({ where: { isActive: true } });
  let best: any = null;
  for (const t of tlds) {
    if (d.endsWith(t.tld) && (!best || t.tld.length > best.tld.length)) best = t;
  }
  return best;
}

export function isValidDomain(domain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i.test(domain);
}

/**
 * Best-effort availability check via public RDAP (no API key). A 404 means the
 * domain is unregistered (available). Network failures return null (unknown).
 */
export async function checkAvailability(domain: string): Promise<boolean | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: ctrl.signal, headers: { Accept: "application/rdap+json" } });
    if (res.status === 404) return true;
    if (res.ok) return false;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
