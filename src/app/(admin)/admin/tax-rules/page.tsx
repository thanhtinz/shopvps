"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { boxSizing: "border-box" as const, background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "inherit" };

export default function AdminTaxRulesPage() {
  const { t } = useLocale();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ country: "", label: "VAT", rate: "" });
  const [error, setError] = useState("");

  function load() { fetch("/api/admin/tax-rules").then(r => r.json()).then(d => { setRules(d.data || []); setLoading(false); }); }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/admin/tax-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rate: parseFloat(form.rate) || 0 }) });
    const d = await res.json();
    if (d.success) { setForm({ country: "", label: "VAT", rate: "" }); load(); }
    else setError(d.error || t("Không thể lưu"));
  }

  async function toggle(id: string, cur: boolean) {
    await fetch(`/api/admin/tax-rules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) });
    load();
  }
  async function remove(id: string) {
    if (!confirm(t("Xoá quy tắc thuế này?"))) return;
    await fetch(`/api/admin/tax-rules/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />;

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>{t("Quy tắc thuế theo quốc gia")}</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{t("Dùng mã quốc gia ISO-2 (vd VN, US), hoặc * cho mức mặc định. Giá đã bao gồm thuế.")}</p>

      <form onSubmit={save} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value.toUpperCase() }))} placeholder={t("Quốc gia (ISO-2 hoặc *)")} required style={{ ...inputStyle, width: 160 }} />
        <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder={t("Tên thuế")} style={{ ...inputStyle, width: 140 }} />
        <input type="number" step="0.01" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} placeholder={t("Thuế suất %")} required style={{ ...inputStyle, width: 120 }} />
        <button type="submit" style={{ padding: "9px 18px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Lưu")}</button>
      </form>
      {error && <div style={{ background: "var(--red-soft)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "9px 12px", color: "var(--red)", fontSize: 13, marginBottom: 14 }}>⚠ {error}</div>}

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[t("Quốc gia"), t("Tên thuế"), t("Thuế suất"), t("Trạng thái"), ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có quy tắc nào")}</td></tr>}
            {rules.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>{r.country}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{r.label}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{Number(r.rate)}%</td>
                <td style={{ padding: "12px 14px" }}><Badge color={r.isActive ? "green" : "gray"}>{r.isActive ? t("Đang bật") : t("Tắt")}</Badge></td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <button onClick={() => toggle(r.id, r.isActive)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: r.isActive ? "var(--red)" : "var(--green)", fontSize: 11.5, cursor: "pointer", fontWeight: 600, marginRight: 6 }}>{r.isActive ? t("Tắt") : t("Bật")}</button>
                  <button onClick={() => remove(r.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
