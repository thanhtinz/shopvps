"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminPayoutsPage() {
  const { t } = useLocale();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  function load() {
    const q = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/payouts${q}`).then(r => r.json()).then(d => { setPayouts(d.data || []); setLoading(false); });
  }
  useEffect(() => { load(); }, [filter]);

  async function act(id: string, action: "approve" | "reject") {
    const adminNote = action === "reject" ? (prompt(t("Lý do từ chối (tuỳ chọn)")) || undefined) : (prompt(t("Ghi chú duyệt (tuỳ chọn)")) || undefined);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, adminNote }) });
      const d = await res.json();
      if (d.success) load(); else alert(d.error);
    } finally { setBusyId(null); }
  }

  const statusColor: Record<string, "green" | "red" | "yellow" | "gray"> = { PAID: "green", PENDING: "yellow", REJECTED: "red" };
  const statusLabel: Record<string, string> = { PAID: t("Đã thanh toán"), PENDING: t("Chờ duyệt"), REJECTED: t("Từ chối") };

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Yêu cầu rút tiền")}</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {[["", t("Tất cả")], ["PENDING", t("Chờ duyệt")], ["PAID", t("Đã thanh toán")], ["REJECTED", t("Từ chối")]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: filter === v ? "var(--accent)" : "var(--bg-elevated)", color: filter === v ? "white" : "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t("Khách hàng"), t("Số tiền"), t("Phương thức"), t("Nơi nhận"), t("Trạng thái"), t("Ngày"), ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có yêu cầu nào")}</td></tr>}
            {payouts.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)" }}>{p.user?.name || p.user?.email || "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(p.amount)}</td>
                <td style={{ padding: "12px 14px", fontSize: 12.5 }}>{p.method}{p.auto ? ` · ${t("Tự động")}` : ""}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.destination || "—"}</td>
                <td style={{ padding: "12px 14px" }}><Badge color={statusColor[p.status] || "gray"}>{statusLabel[p.status] || p.status}</Badge></td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</td>
                <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {p.status === "PENDING" && (
                    <>
                      <button onClick={() => act(p.id, "approve")} disabled={busyId === p.id} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--green)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6, opacity: busyId === p.id ? 0.6 : 1 }}>{t("Duyệt")}</button>
                      <button onClick={() => act(p.id, "reject")} disabled={busyId === p.id} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 12, cursor: "pointer" }}>{t("Từ chối")}</button>
                    </>
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
