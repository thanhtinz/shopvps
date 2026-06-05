import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { t } = await getServerT();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, user: { select: { name: true, email: true, company: true, phone: true, address: true, city: true, country: true, taxId: true } } },
  });
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const settings = await prisma.setting.findMany({ where: { key: { in: ["app_name", "app_url"] } } });
  const s = Object.fromEntries(settings.map((x: any) => [x.key, x.value]));
  const appName = s.app_name || "ShopVPS";

  const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${t("Hoá đơn")} ${invoice.invoiceNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #4f7cff; }
  .logo { font-size: 24px; font-weight: 900; color: #4f7cff; letter-spacing: -0.03em; }
  .invoice-title { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  .invoice-meta { color: #666; font-size: 13px; margin-top: 4px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 700; color: #999; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #4f7cff; color: white; padding: 10px 14px; text-align: left; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
  td { padding: 12px 14px; border-bottom: 1px solid #eee; }
  .total-row { background: #f8f9fa; font-weight: 700; font-size: 16px; }
  .total-row td { border-bottom: none; padding: 14px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; background: ${invoice.status === "PAID" ? "#dcfce7" : "#fee2e2"}; color: ${invoice.status === "PAID" ? "#166534" : "#991b1b"}; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div><div class="logo">${appName}</div><div style="color:#666;font-size:13px;margin-top:4px">${s.app_url||""}</div></div>
  <div style="text-align:right">
    <div class="invoice-title">${t("HOÁ ĐƠN")}</div>
    <div class="invoice-meta">${invoice.invoiceNumber}</div>
    <div style="margin-top:8px"><span class="status-badge">${invoice.status === "PAID" ? t("Đã thanh toán") : invoice.status}</span></div>
  </div>
</div>

<div style="display:flex;gap:40px;margin-bottom:32px">
  <div class="section" style="flex:1">
    <div class="section-title">${t("Thông tin khách hàng")}</div>
    <div class="info-box">
      ${invoice.user?.company ? `<div style="font-weight:700;margin-bottom:4px">${invoice.user.company}</div>` : ""}
      <div style="${invoice.user?.company ? "color:#666" : "font-weight:700"};margin-bottom:4px">${invoice.user?.name || "—"}</div>
      <div style="color:#666">${invoice.user?.email}</div>
      ${invoice.user?.phone ? `<div style="color:#666">${invoice.user.phone}</div>` : ""}
      ${invoice.user?.address ? `<div style="color:#666">${[invoice.user.address, invoice.user.city, invoice.user.country].filter(Boolean).join(", ")}</div>` : ""}
      ${invoice.user?.taxId ? `<div style="color:#666">${t("MST:")} ${invoice.user.taxId}</div>` : ""}
    </div>
  </div>
  <div class="section" style="flex:1">
    <div class="section-title">${t("Chi tiết hoá đơn")}</div>
    <div class="info-box">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#666">${t("Ngày tạo:")}</span><span>${new Date(invoice.createdAt).toLocaleDateString("vi-VN")}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#666">${t("Ngày thanh toán:")}</span><span>${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("vi-VN") : "—"}</span></div>
    </div>
  </div>
</div>

<table>
  <thead><tr><th>${t("Mô tả")}</th><th style="text-align:center">${t("Số lượng")}</th><th style="text-align:right">${t("Đơn giá")}</th><th style="text-align:right">${t("Thành tiền")}</th></tr></thead>
  <tbody>
    ${invoice.items.map((item: any) => `<tr><td>${item.description}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatVND(Number(item.unitPrice))}</td><td style="text-align:right">${formatVND(Number(item.total))}</td></tr>`).join("")}
    ${Number(invoice.discount) > 0 ? `<tr><td colspan="3" style="text-align:right;color:#666">${t("Giảm giá")}${invoice.couponCode ? ` (${invoice.couponCode})` : ""}:</td><td style="text-align:right;color:#dc2626">-${formatVND(Number(invoice.discount))}</td></tr>` : ""}
    ${Number(invoice.tax) > 0 ? `<tr><td colspan="3" style="text-align:right;color:#666">${t("Trong đó thuế VAT (đã gồm):")}</td><td style="text-align:right;color:#666">${formatVND(Number(invoice.tax))}</td></tr>` : ""}
    <tr class="total-row"><td colspan="3" style="text-align:right">${t("Tổng cộng:")}</td><td style="text-align:right;color:#4f7cff">${formatVND(Number(invoice.total))}</td></tr>
  </tbody>
</table>

<div class="footer"><p>${t("Cảm ơn bạn đã sử dụng dịch vụ của")} ${appName}!</p><p style="margin-top:4px">${t("Nếu có thắc mắc, vui lòng liên hệ qua hệ thống ticket hỗ trợ.")}</p></div>
<script>window.onload=()=>window.print()</script>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
