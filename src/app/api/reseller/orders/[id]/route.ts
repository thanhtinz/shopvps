import { authReseller, unauthorized } from "@/lib/reseller";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authReseller(req);
  if (!a) return unauthorized();
  const { id } = await params;
  const o = await prisma.productOrder.findFirst({ where: { id, userId: a.userId }, include: { product: { select: { name: true, category: true } } } });
  if (!o) return Response.json({ error: "Not found" }, { status: 404 });
  let credentials: string | null = null;
  if (o.credentials) { try { credentials = decrypt(o.credentials); } catch { credentials = null; } }
  return Response.json({ success: true, data: { id: o.id, name: o.product?.name, category: o.category, label: o.label, status: o.status, price: Number(o.price), billingCycle: o.billingCycle, expiresAt: o.expiresAt, config: o.config, data: o.data, credentials } });
}
