"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const empty = { code: "", name: "", symbol: "", rate: "1", decimals: "0", position: "before", isActive: true, isBase: false };

export default function AdminCurrenciesPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/admin/currencies").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/admin/currencies", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    setSaving(false); setOpen(false); setForm(empty); load();
  }
  async function patch(id: string, data: any) {
    await fetch(`/api/admin/currencies/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    load();
  }
  async function remove(id: string) {
    if (!confirm(t("Xoá tiền tệ này?"))) return;
    const res = await fetch(`/api/admin/currencies/${id}`, { method:"DELETE" });
    if (!res.ok) { const d = await res.json().catch(()=>({})); alert(d.error || t("Lỗi")); }
    load();
  }

  const inp = { background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 11px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" as const };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Tiền tệ")}</h1>
          <p style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:2 }}>{t("Tỷ giá = số đơn vị tiền cơ sở cho 1 đơn vị tiền này (vd: 1 USD = 24000)")}</p>
        </div>
        <button onClick={()=>setOpen(true)} style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>{t("+ Thêm tiền tệ")}</button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:200, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Mã"),t("Tên"),t("Ký hiệu"),t("Tỷ giá"),t("Số lẻ"),t("Trạng thái"),t("Cơ sở"),t("Thao tác")].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(c=>(
                <tr key={c.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{c.code}</td>
                  <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-secondary)" }}>{c.name}</td>
                  <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-secondary)" }}>{c.symbol}</td>
                  <td style={{ padding:"11px 14px" }}>
                    {c.isBase ? <span style={{ fontSize:13, color:"var(--text-muted)" }}>{t("1 (cơ sở)")}</span> : (
                      <input defaultValue={Number(c.rate)} onBlur={e=>{ const v=parseFloat(e.target.value); if(v && v!==Number(c.rate)) patch(c.id,{rate:v}); }} style={{ ...inp, width:110, padding:"6px 8px" }}/>
                    )}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-secondary)" }}>{c.decimals}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>patch(c.id,{ isActive: !c.isActive })} style={{ border:"none", background:"transparent", cursor:"pointer" }}>
                      <Badge color={c.isActive?"green":"gray"}>{c.isActive?t("Bật"):t("Tắt")}</Badge>
                    </button>
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    {c.isBase ? <Badge color="blue">{t("Cơ sở")}</Badge> : <button onClick={()=>patch(c.id,{ isBase:true })} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer" }}>{t("Đặt cơ sở")}</button>}
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    {!c.isBase && <button onClick={()=>remove(c.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>{t("Xoá")}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setOpen(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:460, maxWidth:"92vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:18 }}>{t("Thêm tiền tệ")}</h3>
            <form onSubmit={add} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label={t("Mã (USD)")}><input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} required style={inp}/></Field>
              <Field label={t("Tên")}><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={inp}/></Field>
              <Field label={t("Ký hiệu ($)")}><input value={form.symbol} onChange={e=>setForm({...form,symbol:e.target.value})} style={inp}/></Field>
              <Field label={t("Tỷ giá (so với cơ sở)")}><input type="number" step="any" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} disabled={form.isBase} style={inp}/></Field>
              <Field label={t("Số chữ số thập phân")}><input type="number" value={form.decimals} onChange={e=>setForm({...form,decimals:e.target.value})} style={inp}/></Field>
              <Field label={t("Vị trí ký hiệu")}>
                <select value={form.position} onChange={e=>setForm({...form,position:e.target.value})} style={inp}>
                  <option value="before">{t("Trước ($100)")}</option>
                  <option value="after">{t("Sau (100₫)")}</option>
                </select>
              </Field>
              <label style={{ gridColumn:"1/3", display:"flex", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
                <input type="checkbox" checked={form.isBase} onChange={e=>setForm({...form,isBase:e.target.checked})}/> {t("Đặt làm tiền tệ cơ sở (tỷ giá = 1)")}
              </label>
              <div style={{ gridColumn:"1/3", display:"flex", gap:10, marginTop:6 }}>
                <button type="button" onClick={()=>setOpen(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{saving?t("Đang lưu..."):t("Thêm")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}
