import { prisma } from "@/lib/prisma";

export interface ResellerAuth { userId: string; keyId: string }

/**
 * Authenticate a reseller API request via `Authorization: Bearer sk_...` (or an
 * `x-api-key` header). Returns null when the key is missing/invalid/inactive or
 * the owning account is not ACTIVE. Updates lastUsedAt best-effort.
 */
export async function authReseller(req: Request): Promise<ResellerAuth | null> {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const key = bearer || req.headers.get("x-api-key") || "";
  if (!key) return null;

  const apiKey = await prisma.apiKey.findUnique({ where: { key }, include: { user: { select: { id: true, status: true } } } });
  if (!apiKey || !apiKey.isActive || apiKey.user.status !== "ACTIVE") return null;

  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { userId: apiKey.userId, keyId: apiKey.id };
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Invalid or missing API key" }), { status: 401, headers: { "Content-Type": "application/json" } });
}
