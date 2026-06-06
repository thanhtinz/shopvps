"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const statusColor: Record<string, "green" | "yellow" | "red" | "gray"> = { ISSUED: "green", AWAITING_VALIDATION: "yellow", PENDING: "yellow", REVOKED: "red", EXPIRED: "gray" };
const statusLabel: Record<string, string> = { PENDING: "Chờ xử lý", AWAITING_VALIDATION: "Chờ xác thực", ISSUED: "Đã cấp", REVOKED: "Đã thu hồi", EXPIRED: "Hết hạn" };

const inp = { width: "100%", boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13.5, outline: "none", fontFamily: "inherit" };

export default function AdminSslOrdersPage() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState<any>(null);
  const [cert, setCert] = useState("");
  const [caBundle, setCaBundle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/admin/ssl").then(r => r.json()).then(d => { setOrders(d.data || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  function openManage(o: any) { setManage(o); setCert(o.certificate || ""); setCaBundle(o.caBundle || ""); setExpiresAt(""); }

  async function issue() {
    if (!cert.trim()) { alert(t("Vui lòng nhập nội dung chứng chỉ.")); return; }
    setBusy(true);
    const body: any = { action: "issue", certificate: cert };
    if (caBundle.trim()) body.caBundle = caBundle;
    if (expiresAt) body.expiresAt = expiresAt;
    const res = await fetch(`/api/admin/ssl/${manage.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { alert(d.error || t("Lỗi")); return; }
    setManage(null); load();
  }

  async function revoke() {
    if (!confirm(t("Thu hồi chứng chỉ này?"))) return;
    setBusy(true);
    const res = await fetch(`/api/admin/ssl/${manage.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke" }) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { alert(d.error || t("Lỗi")); return; }
    setManage(null); load();
  }

  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>{t("Đơn chứng chỉ SSL")}</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>{t("Cấp và quản lý chứng chỉ SSL cho khách hàng.")}</p>

      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("Tất cả đơn SSL")} ({orders.length})</div>
        {loading ? <div className="skeleton" style={{ height: 160, margin: 16, borderRadius: "var(--radius-md)" }} /> : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có đơn SSL nào.")}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Tên miền", "Khách hàng", "Gói", "Trạng thái", "Ngày tạo", "Hết hạn", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h ? t(h) : h}</th>
              ))}
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{o.commonName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>{o.user?.email || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>{o.plan?.name || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><Badge color={statusColor[o.status] || "gray"}>{statusLabel[o.status] ? t(statusLabel[o.status]) : o.status}</Badge></td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)" }}>{o.createdAt ? formatDate(o.createdAt) : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)" }}>{o.expiresAt ? formatDate(o.expiresAt) : "—"}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button onClick={() => openManage(o)} style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12.5, cursor: "pointer" }}>{t("Quản lý")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {manage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setManage(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "26px", width: 620, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{manage.commonName}</h3>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>{statusLabel[manage.status] ? t(statusLabel[manage.status]) : manage.status} · {manage.plan?.name || ""} {manage.validationMethod ? `· ${manage.validationMethod}` : ""}</div>

            {manage.csr && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{t("CSR")}</label>
                <pre style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, fontSize: 11.5, color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, maxHeight: 160 }}>{manage.csr}</pre>
              </div>
            )}

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{t("Chứng chỉ (PEM)")}</label>
            <textarea value={cert} onChange={e => setCert(e.target.value)} rows={5} placeholder={t("Dán nội dung chứng chỉ PEM…")} style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, marginBottom: 14 }} />

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{t("CA Bundle (tuỳ chọn)")}</label>
            <textarea value={caBundle} onChange={e => setCaBundle(e.target.value)} rows={4} placeholder={t("Dán CA bundle nếu có…")} style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, marginBottom: 14 }} />

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{t("Ngày hết hạn (tuỳ chọn)")}</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} placeholder={t("Mặc định: cộng số năm của gói từ hôm nay")} style={{ ...inp, marginBottom: 6 }} />
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 18 }}>{t("Mặc định: cộng số năm của gói từ hôm nay")}</p>

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button onClick={issue} disabled={busy} style={{ flex: 1, padding: "10px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{busy ? "..." : t("Cấp chứng chỉ")}</button>
              <button onClick={revoke} disabled={busy} style={{ flex: 1, padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--red)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t("Thu hồi")}</button>
            </div>
            <button onClick={() => setManage(null)} style={{ width: "100%", padding: "9px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer" }}>{t("Đóng")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
