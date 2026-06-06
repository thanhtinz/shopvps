"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const inp = { boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: 13, color: "var(--text-primary)" };

const typeColor: Record<string, "blue" | "purple" | "green"> = { DV: "blue", OV: "purple", EV: "green" };

export default function AdminSslPlansPage() {
  const { t } = useLocale();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [p, setP] = useState({ name: "", brand: "", type: "DV", wildcard: false, years: "1", price: "" });

  function load() {
    fetch("/api/admin/ssl-plans").then(r => r.json()).then(d => { setPlans(d.data || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    const body = { name: p.name, brand: p.brand, type: p.type, wildcard: p.wildcard, years: Number(p.years), price: Number(p.price), isActive: true, sortOrder: 0 };
    const res = await fetch("/api/admin/ssl-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if ((await res.json()).success !== false) { setP({ name: "", brand: "", type: "DV", wildcard: false, years: "1", price: "" }); setShowForm(false); load(); }
  }
  async function patchPlan(id: string, data: any) { await fetch(`/api/admin/ssl-plans/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); load(); }
  async function delPlan(id: string) { if (!confirm(t("Xoá gói SSL này?"))) return; await fetch(`/api/admin/ssl-plans/${id}`, { method: "DELETE" }); load(); }

  if (loading) return <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />;
  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" };

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Gói chứng chỉ SSL")}</h1>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Thêm gói")}</button>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 18 }}>{t("Danh mục gói SSL khách có thể đăng ký (DV/OV/EV, wildcard).")}</p>

      {showForm && (
        <form onSubmit={addPlan} style={{ ...card, padding: 16, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input value={p.name} onChange={e => setP(s => ({ ...s, name: e.target.value }))} placeholder={t("Tên gói (vd: PositiveSSL)")} required style={inp} />
          <input value={p.brand} onChange={e => setP(s => ({ ...s, brand: e.target.value }))} placeholder={t("Thương hiệu (vd: Sectigo)")} style={inp} />
          <select value={p.type} onChange={e => setP(s => ({ ...s, type: e.target.value }))} style={inp}>
            <option value="DV">{t("DV – Xác thực tên miền")}</option>
            <option value="OV">{t("OV – Xác thực tổ chức")}</option>
            <option value="EV">{t("EV – Xác thực mở rộng")}</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={p.wildcard} onChange={e => setP(s => ({ ...s, wildcard: e.target.checked }))} /> {t("Wildcard")}
          </label>
          <input type="number" value={p.years} onChange={e => setP(s => ({ ...s, years: e.target.value }))} placeholder={t("Số năm")} required style={inp} />
          <input type="number" value={p.price} onChange={e => setP(s => ({ ...s, price: e.target.value }))} placeholder={t("Giá")} required style={inp} />
          <button type="submit" style={{ gridColumn: "1/-1", padding: 9, background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Lưu gói")}</button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {plans.length === 0 && <div style={{ ...card, padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có gói SSL nào.")}</div>}
        {plans.map(plan => (
          <div key={plan.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{plan.name} <Badge color={typeColor[plan.type] || "gray"}>{plan.type}</Badge> {plan.wildcard && <Badge color="cyan">{t("Wildcard")}</Badge>} {!plan.isActive && <Badge color="gray">{t("Tắt")}</Badge>}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{plan.brand ? `${plan.brand} · ` : ""}{formatCurrency(plan.price)} · {plan.years} {t("năm")}</div>
              </div>
              <button onClick={() => patchPlan(plan.id, { isActive: !plan.isActive })} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: plan.isActive ? "var(--red)" : "var(--green)", fontSize: 11.5, cursor: "pointer" }}>{plan.isActive ? t("Tắt") : t("Bật")}</button>
              <button onClick={() => delPlan(plan.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
