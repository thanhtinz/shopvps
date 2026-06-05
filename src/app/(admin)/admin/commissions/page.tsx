"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const statusColor: Record<string, "green"|"yellow"|"red"|"gray"> = { PENDING: "yellow", APPROVED: "green", PAID: "green", CANCELLED: "red" };

export default function AdminCommissionsPage() {
  const { t } = useLocale();
  const STATUS = [
    { key: "PENDING", label: t("Chờ duyệt") },
    { key: "PAID", label: t("Đã trả") },
    { key: "CANCELLED", label: t("Đã huỷ") },
    { key: "", label: t("Tất cả") },
  ];
  const statusLabel: Record<string, string> = { PENDING: t("Chờ duyệt"), APPROVED: t("Đã duyệt"), PAID: t("Đã trả"), CANCELLED: t("Đã huỷ") };
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/commissions?status=${status}`).then(r => r.json()).then(d => {
      setItems(d.data?.items || []); setPendingTotal(d.data?.pendingTotal || 0); setLoading(false);
    });
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id + action);
    try {
      const res = await fetch("/api/admin/commissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      if (res.ok) load();
    } finally { setBusy(null); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Hoa hồng affiliate")}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("Đang chờ duyệt")}: <strong style={{ color: "var(--yellow)" }}>{formatCurrency(pendingTotal)}</strong></p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4 }}>
          {STATUS.map(s => (
            <button key={s.key} onClick={() => setStatus(s.key)} style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: status === s.key ? "var(--bg-surface)" : "transparent", color: status === s.key ? "var(--text-primary)" : "var(--text-muted)" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {loading ? <div className="skeleton" style={{ height: 300, margin: 16, borderRadius: "var(--radius-md)" }} /> : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: 13 }}>{t("Không có hoa hồng nào")}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[t("Người nhận"), t("Loại"), t("Số tiền"), t("Trạng thái"), t("Ngày"), t("Thao tác")].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.user?.name || "—"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.user?.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase" }}>{c.orderType || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(c.amount)}</td>
                  <td style={{ padding: "12px 16px" }}><Badge color={statusColor[c.status] || "gray"}>{statusLabel[c.status] || c.status}</Badge></td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {c.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => act(c.id, "approve")} disabled={!!busy} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--green)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {busy === c.id + "approve" ? "..." : t("Duyệt")}
                        </button>
                        <button onClick={() => act(c.id, "reject")} disabled={!!busy} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {busy === c.id + "reject" ? "..." : t("Từ chối")}
                        </button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
