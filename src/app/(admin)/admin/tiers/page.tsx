"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const inp = { boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: 13, color: "var(--text-primary)" };

export default function AdminTiersPage() {
  const { t } = useLocale();
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", discountPercent: "", isDefault: false, isReseller: false });
  const [pricesFor, setPricesFor] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ prices: any[]; products: any[] }>({ prices: [], products: [] });
  const [pf, setPf] = useState({ refId: "", priceMonthly: "" });

  function load() { fetch("/api/admin/tiers").then(r => r.json()).then(d => { setTiers(d.data || []); setLoading(false); }); }
  useEffect(() => { load(); }, []);

  async function addTier(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/tiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, discountPercent: Number(form.discountPercent) || 0 }) });
    if ((await res.json()).success) { setForm({ name: "", discountPercent: "", isDefault: false, isReseller: false }); load(); }
  }
  async function patchTier(id: string, data: any) { await fetch(`/api/admin/tiers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); load(); }
  async function delTier(id: string) { if (!confirm(t("Xoá bậc giá này?"))) return; await fetch(`/api/admin/tiers/${id}`, { method: "DELETE" }); load(); }

  async function openPrices(id: string) {
    setPricesFor(id);
    const d = await fetch(`/api/admin/tiers/${id}/prices`).then(r => r.json());
    setPriceData(d.data || { prices: [], products: [] });
  }
  async function addPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!pricesFor || !pf.refId) return;
    await fetch(`/api/admin/tiers/${pricesFor}/prices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope: "product", refId: pf.refId, priceMonthly: Number(pf.priceMonthly) || 0 }) });
    setPf({ refId: "", priceMonthly: "" }); openPrices(pricesFor);
  }
  async function delPrice(priceId: string) { if (!pricesFor) return; await fetch(`/api/admin/tiers/${pricesFor}/prices?priceId=${priceId}`, { method: "DELETE" }); openPrices(pricesFor); }

  if (loading) return <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />;
  const prodName = (id: string) => priceData.products.find(p => p.id === id)?.name || id;

  return (
    <div style={{ maxWidth: 880 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>{t("Bậc giá / Reseller")}</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{t("Mỗi bậc có thể giảm theo % và/hoặc đặt giá riêng cho từng sản phẩm. Gán bậc cho user ở trang Người dùng.")}</p>

      <form onSubmit={addTier} style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t("Tên bậc (vd Reseller)")} required style={{ ...inp, width: 200 }} />
        <input type="number" step="0.01" value={form.discountPercent} onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))} placeholder={t("Giảm %")} style={{ ...inp, width: 110 }} />
        <label style={{ display: "flex", gap: 6, fontSize: 12.5, color: "var(--text-secondary)", alignItems: "center" }}><input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />{t("Mặc định")}</label>
        <label style={{ display: "flex", gap: 6, fontSize: 12.5, color: "var(--text-secondary)", alignItems: "center" }}><input type="checkbox" checked={form.isReseller} onChange={e => setForm(p => ({ ...p, isReseller: e.target.checked }))} />{t("Reseller")}</label>
        <button type="submit" style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Thêm")}</button>
      </form>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
            {[t("Tên"), t("Giảm %"), t("User"), t("Giá riêng"), "", ""].map((h, i) => <th key={i} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {tiers.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có bậc nào")}</td></tr>}
            {tiers.map(tier => (
              <tr key={tier.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{tier.name} {tier.isDefault && <Badge color="blue">{t("Mặc định")}</Badge>} {tier.isReseller && <Badge color="purple">Reseller</Badge>}</td>
                <td style={{ padding: "12px 14px" }}>
                  <input type="number" step="0.01" defaultValue={Number(tier.discountPercent)} onBlur={e => patchTier(tier.id, { discountPercent: e.target.value })} style={{ ...inp, width: 80 }} />
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)" }}>{tier._count?.users ?? 0}</td>
                <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)" }}>{tier._count?.prices ?? 0}</td>
                <td style={{ padding: "12px 14px" }}><button onClick={() => openPrices(tier.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 11.5, cursor: "pointer" }}>{t("Giá riêng")}</button></td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>{!tier.isDefault && <button onClick={() => delTier(tier.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pricesFor && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("Giá riêng cho sản phẩm")}</h3>
            <button onClick={() => setPricesFor(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <form onSubmit={addPrice} style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <select value={pf.refId} onChange={e => setPf(p => ({ ...p, refId: e.target.value }))} required style={{ ...inp, minWidth: 240, cursor: "pointer" }}>
              <option value="">{t("Chọn sản phẩm")}</option>
              {priceData.products.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.priceMonthly)})</option>)}
            </select>
            <input type="number" value={pf.priceMonthly} onChange={e => setPf(p => ({ ...p, priceMonthly: e.target.value }))} placeholder={t("Giá/tháng")} required style={{ ...inp, width: 140 }} />
            <button type="submit" style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Đặt giá")}</button>
          </form>
          {priceData.prices.length === 0 ? <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Chưa có giá riêng. Sẽ dùng giảm %.")}</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {priceData.prices.map(pr => (
                <div key={pr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{prodName(pr.refId)}</span>
                  <span><b style={{ color: "var(--text-primary)" }}>{formatCurrency(pr.priceMonthly)}</b> <button onClick={() => delPrice(pr.id)} style={{ marginLeft: 10, background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>×</button></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
