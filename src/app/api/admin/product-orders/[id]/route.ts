import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { getUserT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const existing = await prisma.productOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (["PENDING", "ACTIVE", "SUSPENDED", "TERMINATED"].includes(b.status)) data.status = b.status;
  if (b.label != null) data.label = String(b.label);
  if (b.notes !== undefined) data.notes = b.notes || null;
  if (b.credentials !== undefined) data.credentials = b.credentials ? encrypt(String(b.credentials)) : null;
  if (b.data !== undefined) { try { data.data = b.data ? (typeof b.data === "string" ? JSON.parse(b.data) : b.data) : null; } catch { return NextResponse.json({ error: "Invalid data JSON" }, { status: 400 }); } }

  const order = await prisma.productOrder.update({ where: { id }, data });

  // Notify the customer when their order is activated.
  if (data.status === "ACTIVE" && existing.status !== "ACTIVE") {
    const { t } = await getUserT(order.userId);
    await prisma.notification.create({ data: { userId: order.userId, type: "SUCCESS", title: t("Dịch vụ đã kích hoạt"), content: `${order.label} ${t("đã được kích hoạt.")}` } });
  }
  return NextResponse.json({ success: true, data: order });
}
