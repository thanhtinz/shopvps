import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoIssueLetsEncrypt } from "@/lib/ssl";
import { getServerT } from "@/lib/i18n/server";
async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

// Admin issuance / revocation of an SSL order.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const b = await req.json();
  if (b.action === "issue") {
    if (!b.certificate) return NextResponse.json({ error: t("Thiếu chứng chỉ") }, { status: 400 });
    const order = await prisma.sslOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: t("Không tìm thấy") }, { status: 404 });
    const expiresAt = b.expiresAt ? new Date(b.expiresAt) : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + order.years); return d; })();
    return NextResponse.json({ success: true, data: await prisma.sslOrder.update({ where: { id }, data: { status: "ISSUED", certificate: b.certificate, caBundle: b.caBundle || null, issuedAt: new Date(), expiresAt } }) });
  }
  if (b.action === "autoissue") {
    const order = await prisma.sslOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: t("Không tìm thấy") }, { status: 404 });
    const res = await autoIssueLetsEncrypt({ commonName: order.commonName, csr: order.csr });
    if (!res) return NextResponse.json({ error: t("Cấp tự động thất bại — kiểm tra cấu hình ACME/DNS hoặc cấp thủ công.") }, { status: 502 });
    return NextResponse.json({ success: true, data: await prisma.sslOrder.update({ where: { id }, data: { status: "ISSUED", provider: "letsencrypt", certificate: res.certificate, caBundle: res.caBundle || null, privateKey: res.privateKey || null, issuedAt: new Date(), expiresAt: res.expiresAt } }) });
  }
  if (b.action === "revoke") return NextResponse.json({ success: true, data: await prisma.sslOrder.update({ where: { id }, data: { status: "REVOKED" } }) });
  if (b.action === "status" && ["PENDING","AWAITING_VALIDATION","ISSUED","REVOKED","EXPIRED"].includes(b.status))
    return NextResponse.json({ success: true, data: await prisma.sslOrder.update({ where: { id }, data: { status: b.status } }) });
  return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
}
