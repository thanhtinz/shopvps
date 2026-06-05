import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();

  const domain = await prisma.domainOrder.findUnique({ where: { id } });
  if (!domain) return NextResponse.json({ error: t("Không tìm thấy") }, { status: 404 });

  const data: any = {};
  if (b.status && ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "TRANSFERRED"].includes(b.status)) data.status = b.status;
  if (typeof b.registrar === "string") data.registrar = b.registrar;
  if (typeof b.nameservers === "string") data.nameservers = b.nameservers.trim() || null;

  // Activating a pending domain: stamp registration + expiry (now + years) if unset.
  if (b.status === "ACTIVE" && domain.status !== "ACTIVE") {
    data.registeredAt = domain.registeredAt || new Date();
    if (!domain.expiresAt) {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + (domain.years || 1));
      data.expiresAt = exp;
    }
    await prisma.notification.create({ data: { userId: domain.userId, type: "SUCCESS", title: "Tên miền đã kích hoạt", content: `Tên miền ${domain.domain} đã được kích hoạt.` } });
  }

  const item = await prisma.domainOrder.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: item });
}
