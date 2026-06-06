"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const inp = { boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: 13, color: "var(--text-primary)" };

export default function AdminConfigOptionsPage() {
  const { t } = useLocale();
  const [options, setOptions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [o, setO] = useState({ name: "", type: "select", refId: "", required: false, description: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [choice, setChoice] = useState({ label: "", priceMonthly: "" });

  function load() {
    fetch("/api/admin/config-options").then(r => r.json()).then(d => { setOptions(d.data?.options || []); setProducts(d.data?.products || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function addOption(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/config-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
    if ((await res.json()).success) { setO({ name: "", type: "select", refId: "", required: false, description: "" }); setShowForm(false); load(); }
  }
  async function delOption(id: string) { if (!confirm(t("Xoá tuỳ chọn này?"))) return; await fetch(`/api/admin/config-options/${id}`, { method: "DELETE" }); load(); }
  async function patchOption(id: string, data: any) { await fetch(`/api/admin/config-options/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); load(); }
  async function addChoice(optionId: string, e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/config-options/${optionId}/choices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(choice) });
    setChoice({ label: "", priceMonthly: "" }); load();
  }
  async function delChoice(optionId: string, choiceId: string) { await fetch(`/api/admin/config-options/${optionId}/choices?choiceId=${choiceId}`, { method: "DELETE" }); load(); }

  if (loading) return <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />;
  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" };
  const productName = (id: string | null) => id ? (products.find(p => p.id === id)?.name || id) : t("Mọi sản phẩm");

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Tuỳ chọn cấu hình")}</h1>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Thêm tuỳ chọn")}</button>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 18 }}>{t("Add-on khách chọn khi mua (thêm RAM, IP, backup…), tính phí định kỳ.")}</p>

      {showForm && (
        <form onSubmit={addOption} style={{ ...card, padding: 16, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input value={o.name} onChange={e => setO(p => ({ ...p, name: e.target.value }))} placeholder={t("Tên tuỳ chọn (vd: Thêm RAM)")} required style={inp} />
          <select value={o.type} onChange={e => setO(p => ({ ...p, type: e.target.value }))} style={inp}>
            <option value="select">{t("Chọn 1 trong nhiều (select)")}</option>
            <option value="checkbox">{t("Bật/tắt (checkbox)")}</option>
          </select>
          <select value={o.refId} onChange={e => setO(p => ({ ...p, refId: e.target.value }))} style={inp}>
            <option value="">{t("Mọi sản phẩm")}</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={o.required} onChange={e => setO(p => ({ ...p, required: e.target.checked }))} /> {t("Bắt buộc chọn")}
          </label>
          <input value={o.description} onChange={e => setO(p => ({ ...p, description: e.target.value }))} placeholder={t("Mô tả")} style={{ ...inp, gridColumn: "1/-1" }} />
          <button type="submit" style={{ gridColumn: "1/-1", padding: 9, background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Lưu tuỳ chọn")}</button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.length === 0 && <div style={{ ...card, padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có tuỳ chọn nào.")}</div>}
        {options.map(opt => (
          <div key={opt.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{opt.name} <Badge color="gray">{opt.type}</Badge> {opt.required && <Badge color="yellow">{t("Bắt buộc")}</Badge>} {!opt.isActive && <Badge color="gray">{t("Tắt")}</Badge>}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{productName(opt.refId)}{opt.description ? ` · ${opt.description}` : ""}</div>
              </div>
              <button onClick={() => setOpen(open === opt.id ? null : opt.id)} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>{opt.choices?.length || 0} {t("lựa chọn")}</button>
              <button onClick={() => patchOption(opt.id, { isActive: !opt.isActive })} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: opt.isActive ? "var(--red)" : "var(--green)", fontSize: 11.5, cursor: "pointer" }}>{opt.isActive ? t("Tắt") : t("Bật")}</button>
              <button onClick={() => delOption(opt.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>
            </div>
            {open === opt.id && (
              <div style={{ padding: "12px 16px", background: "var(--bg-elevated)" }}>
                <form onSubmit={e => addChoice(opt.id, e)} style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <input value={choice.label} onChange={e => setChoice(p => ({ ...p, label: e.target.value }))} placeholder={t("Nhãn (vd: +4 GB)")} required style={{ ...inp, flex: 1, minWidth: 160 }} />
                  <input type="number" value={choice.priceMonthly} onChange={e => setChoice(p => ({ ...p, priceMonthly: e.target.value }))} placeholder={t("Giá/tháng")} style={{ ...inp, width: 130 }} />
                  <button type="submit" style={{ padding: "8px 14px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Thêm lựa chọn")}</button>
                </form>
                {(opt.choices || []).length === 0 ? <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("Chưa có lựa chọn")}</p> : opt.choices.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{c.label} {Number(c.priceMonthly) > 0 && <span style={{ color: "var(--text-muted)" }}>· {formatCurrency(c.priceMonthly)}/{t("tháng")}</span>}</span>
                    <button onClick={() => delChoice(opt.id, c.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
