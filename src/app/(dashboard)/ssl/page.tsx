"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const statusColor: Record<string, "green" | "yellow" | "red" | "gray"> = { ISSUED: "green", AWAITING_VALIDATION: "yellow", PENDING: "yellow", REVOKED: "red", EXPIRED: "gray" };
const statusLabel: Record<string, string> = { PENDING: "Chờ xử lý", AWAITING_VALIDATION: "Chờ xác thực", ISSUED: "Đã cấp", REVOKED: "Đã thu hồi", EXPIRED: "Hết hạn" };

export default function SslPage() {
  const { t: tr } = useLocale();
  const [plans, setPlans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState("");
  const [commonName, setCommonName] = useState("");
  const [validationMethod, setValidationMethod] = useState("DNS");
  const [approverEmail, setApproverEmail] = useState("");
  const [csr, setCsr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [view, setView] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const load = () => Promise.all([
    fetch("/api/ssl/plans").then(r => r.json()),
    fetch("/api/ssl").then(r => r.json()),
  ]).then(([p, o]) => { setPlans(p.data || []); setOrders(o.data || []); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId || !commonName.trim()) { setErr(tr("Vui lòng chọn gói và nhập tên miền.")); return; }
    setBusy(true); setMsg(""); setErr("");
    const body: any = { planId, commonName: commonName.toLowerCase().trim(), validationMethod };
    if (validationMethod === "EMAIL" && approverEmail.trim()) body.approverEmail = approverEmail.trim();
    if (csr.trim()) body.csr = csr;
    const res = await fetch("/api/ssl/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok || d.error) { setErr(d.error || tr("Lỗi")); return; }
    setCommonName(""); setApproverEmail(""); setCsr(""); setPlanId("");
    setMsg(d.message || tr("Đã tạo đơn SSL, đang chờ xử lý."));
    load();
  }

  async function openView(o: any) {
    setView(o); setViewLoading(true); setCopied("");
    const res = await fetch(`/api/ssl/${o.id}`);
    const d = await res.json();
    setViewLoading(false);
    if (res.ok && d.data) setView(d.data);
  }

  async function copy(text: string, which: string) {
    try { await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(""), 1800); } catch {}
  }

  const inp = { width: "100%", boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13.5, outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>{tr("Chứng chỉ SSL")}</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>{tr("Đăng ký và quản lý chứng chỉ SSL cho tên miền của bạn")}</p>

      {msg && <div style={{ marginBottom: 16, padding: "11px 14px", background: "var(--green-soft)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--green)" }}>{msg}</div>}
      {err && <div style={{ marginBottom: 16, padding: "11px 14px", background: "var(--red-soft)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--red)" }}>{err}</div>}

      {/* Order form */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 24 }}>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select value={planId} onChange={e => setPlanId(e.target.value)} style={{ ...inp, gridColumn: "1/-1" } as any}>
            <option value="">{tr("— Chọn gói SSL —")}</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name} · {formatCurrency(p.price)} · {p.type}{p.wildcard ? " · Wildcard" : ""}</option>
            ))}
          </select>
          <input value={commonName} onChange={e => setCommonName(e.target.value)} placeholder={tr("vd: example.com")} style={{ ...inp, gridColumn: "1/-1" } as any} />
          <select value={validationMethod} onChange={e => setValidationMethod(e.target.value)} style={inp as any}>
            <option value="DNS">{tr("Xác thực qua DNS")}</option>
            <option value="HTTP">{tr("Xác thực qua HTTP")}</option>
            <option value="EMAIL">{tr("Xác thực qua Email")}</option>
          </select>
          {validationMethod === "EMAIL" && (
            <input type="email" value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder={tr("Email phê duyệt (vd: admin@example.com)")} style={inp as any} />
          )}
          <textarea value={csr} onChange={e => setCsr(e.target.value)} rows={4} placeholder={tr("CSR (tuỳ chọn — để trống nếu muốn hệ thống tạo)")} style={{ ...inp, gridColumn: "1/-1", resize: "vertical", fontFamily: "monospace", fontSize: 12 } as any} />
          <button type="submit" disabled={busy} style={{ gridColumn: "1/-1", padding: "11px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{busy ? "..." : tr("Đăng ký SSL")}</button>
        </form>
      </div>

      {/* My certificates */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{tr("Chứng chỉ của tôi")} ({orders.length})</div>
        {loading ? <div className="skeleton" style={{ height: 160, margin: 16, borderRadius: "var(--radius-md)" }} /> : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-muted)", fontSize: 13 }}>{tr("Bạn chưa có chứng chỉ SSL nào")}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Tên miền", "Gói", "Trạng thái", "Hết hạn", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h ? tr(h) : h}</th>
              ))}
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{o.commonName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>{o.plan?.name || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><Badge color={statusColor[o.status] || "gray"}>{statusLabel[o.status] ? tr(statusLabel[o.status]) : o.status}</Badge></td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)" }}>{o.expiresAt ? formatDate(o.expiresAt) : "—"}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button onClick={() => openView(o)} style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12.5, cursor: "pointer" }}>{tr("Xem")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {view && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setView(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "26px", width: 620, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{view.commonName}</h3>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>
              {tr("Trạng thái")}: {statusLabel[view.status] ? tr(statusLabel[view.status]) : view.status}
              {view.validationMethod ? ` · ${tr("Xác thực")}: ${view.validationMethod}` : ""}
            </div>

            {viewLoading ? (
              <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-md)", marginBottom: 16 }} />
            ) : view.status === "ISSUED" ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{tr("Chứng chỉ")}</label>
                    <button onClick={() => copy(view.certificate || "", "cert")} style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--accent)", fontSize: 11.5, cursor: "pointer" }}>{copied === "cert" ? tr("Đã sao chép") : tr("Sao chép")}</button>
                  </div>
                  <pre style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, fontSize: 11.5, color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, maxHeight: 200 }}>{view.certificate || "—"}</pre>
                </div>
                {view.caBundle && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{tr("CA Bundle")}</label>
                      <button onClick={() => copy(view.caBundle || "", "ca")} style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--accent)", fontSize: 11.5, cursor: "pointer" }}>{copied === "ca" ? tr("Đã sao chép") : tr("Sao chép")}</button>
                    </div>
                    <pre style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, fontSize: 11.5, color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, maxHeight: 200 }}>{view.caBundle}</pre>
                  </div>
                )}
                {view.privateKey && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{tr("Private Key")}</label>
                      <button onClick={() => copy(view.privateKey || "", "key")} style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--accent)", fontSize: 11.5, cursor: "pointer" }}>{copied === "key" ? tr("Đã sao chép") : tr("Sao chép")}</button>
                    </div>
                    <pre style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, fontSize: 11.5, color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, maxHeight: 200 }}>{view.privateKey}</pre>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{tr("Chứng chỉ chưa được cấp. Vui lòng chờ xử lý.")}</p>
            )}

            <button onClick={() => setView(null)} style={{ width: "100%", padding: "9px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12.5, cursor: "pointer" }}>{tr("Đóng")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
