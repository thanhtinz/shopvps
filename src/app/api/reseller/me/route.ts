import { authReseller, unauthorized } from "@/lib/reseller";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/pricing";

export async function GET(req: Request) {
  const a = await authReseller(req);
  if (!a) return unauthorized();
  const [user, tier] = await Promise.all([
    prisma.user.findUnique({ where: { id: a.userId }, select: { name: true, email: true, balance: true } }),
    getUserTier(a.userId),
  ]);
  return Response.json({ success: true, data: { name: user?.name, email: user?.email, balance: Number(user?.balance || 0), tier: { name: tier.name, discountPercent: tier.discountPercent, isReseller: tier.isReseller } } });
}
