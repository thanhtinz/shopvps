import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.productOrder.findFirst({
    where: { id, userId: session.user.id },
    include: { product: true, cronjobs: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let credentials: string | null = null;
  if (order.credentials) { try { credentials = decrypt(order.credentials); } catch { credentials = null; } }
  return NextResponse.json({ success: true, data: { ...order, credentials } });
}
