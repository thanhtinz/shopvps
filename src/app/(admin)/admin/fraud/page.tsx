"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const inp = { boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: 13, color: "var(--text-primary)" };

export default function AdminFraudPage() {
  const { t } = useLocale();
  const [flagged, setFlagged] = useState<any[]>([]);
  const [blocklist, setBlocklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "EMAIL", value: "", reason: "" });

  function load() {
    Promise.all([
      fetch("/api/admin/fraud").then(r => r.json()),
      fetch("/api/admin/blocklist").then(r => r.json()),
    ]).then(([f, b]) => { setFlagged(f.data || []); setBlocklist(b.data || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function userAction(userId: string, action: "clear" | "ban") {
    if (action === "ban" && !confirm(t("Cấm người dùng này?"))) return;
    await fetch("/api/admin/fraud", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
    load();
  }
  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/blocklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if ((await res.json()).success) { setForm({ type: "EMAIL", value: "", reason: "" }); load(); }
  }
  async function delBlock(id: string) {
    await fetch(`/api/admin/blocklist/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="skeleton" style={{ height: 360, borderRadius: "var(--radius-lg)" }} />;

  const riskColor = (s: number): "red" | "yellow" | "gray" => s >= 60 ? "red" : s >= 30 ? "yellow" : "gray";

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 20 }}>{t("Chống gian lận")}</h1>

      {/* Flagged users */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("Người dùng bị gắn cờ")}</h3>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 28 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t("Người dùng"), t("Điểm rủi ro"), t("Dấu hiệu"), t("Trạng thái"), t("Ngày"), ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flagged.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)", fontSize: 13 }}>{t("Không có người dùng nào bị gắn cờ")}</td></tr>}
            {flagged.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontSize: 12.5 }}><div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{u.name}</div><div style={{ color: "var(--text-muted)" }}>{u.email}</div></td>
                <td style={{ padding: "12px 14px" }}><Badge color={riskColor(u.riskScore)}>{u.riskScore}</Badge></td>
                <td style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--text-secondary)" }}>{Array.isArray(u.riskFlags) ? u.riskFlags.join(", ") : "—"}</td>
                <td style={{ padding: "12px 14px" }}><Badge color={u.status === "BANNED" ? "red" : "green"}>{u.status}</Badge></td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => userAction(u.id, "clear")} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", marginRight: 6 }}>{t("Bỏ cờ")}</button>
                  {u.status !== "BANNED" && <button onClick={() => userAction(u.id, "ban")} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Cấm")}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Blocklist */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("Danh sách chặn")}</h3>
      <form onSubmit={addBlock} style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
          <option value="EMAIL">{t("Email")}</option>
          <option value="DOMAIN">{t("Tên miền email")}</option>
          <option value="IP">IP</option>
          <option value="COUNTRY">{t("Quốc gia (ISO-2)")}</option>
        </select>
        <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder={t("Giá trị")} required style={{ ...inp, width: 220 }} />
        <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder={t("Lý do (tuỳ chọn)")} style={{ ...inp, width: 220 }} />
        <button type="submit" style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Thêm")}</button>
      </form>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t("Loại"), t("Giá trị"), t("Lý do"), ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocklist.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 28, color: "var(--text-muted)", fontSize: 13 }}>{t("Danh sách trống")}</td></tr>}
            {blocklist.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px" }}><Badge color="gray">{b.type}</Badge></td>
                <td style={{ padding: "10px 14px", fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{b.value}</td>
                <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text-muted)" }}>{b.reason || "—"}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button onClick={() => delBlock(b.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
