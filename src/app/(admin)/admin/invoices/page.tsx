"use client";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminInvoicesPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/invoices").then(r => r.json()).then(d => { setInvoices(d.data || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  const statusColor: Record<string, "green" | "red" | "yellow" | "gray"> = { PAID: "green", UNPAID: "red", CANCELLED: "gray", REFUNDED: "yellow" };
  const statusLabel: Record<string, string> = { PAID: t("Đã thanh toán"), UNPAID: t("Chưa thanh toán"), CANCELLED: t("Đã huỷ"), REFUNDED: t("Đã hoàn") };

  async function refund(id: string, total: number) {
    if (!confirm(t("Xác nhận hoàn tiền hoá đơn này? Số tiền sẽ được cộng vào ví khách."))) return;
    const raw = prompt(t("Số tiền hoàn (để trống = hoàn toàn bộ)"), String(total));
    if (raw === null) return; // cancelled
    const amount = raw.trim() === "" ? undefined : Number(raw.replace(/[^\d.]/g, ""));
    if (amount != null && !(amount > 0)) { alert(t("Số tiền hoàn không hợp lệ")); return; }
    const note = prompt(t("Lý do (tuỳ chọn)")) || undefined;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note, amount }) });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error);
    } finally { setBusyId(null); }
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 24 }}>{t("Quản lý hoá đơn")}</h1>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t("Số HĐ"), t("Khách hàng"), t("Tổng tiền"), t("Trạng thái"), t("Ngày"), ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có hoá đơn nào")}</td></tr>
            )}
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--accent)", fontWeight: 600 }}>{inv.invoiceNumber}</span>
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)" }}>{inv.user?.name || inv.user?.email || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(inv.total)}</td>
                <td style={{ padding: "12px 14px" }}><Badge color={statusColor[inv.status] || "gray"}>{statusLabel[inv.status] || inv.status}</Badge></td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(inv.createdAt)}</td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  {inv.status === "PAID" && (
                    <button onClick={() => refund(inv.id, Number(inv.total))} disabled={busyId === inv.id} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: busyId === inv.id ? "not-allowed" : "pointer", opacity: busyId === inv.id ? 0.6 : 1 }}>
                      {busyId === inv.id ? t("Đang hoàn...") : t("Hoàn tiền")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
