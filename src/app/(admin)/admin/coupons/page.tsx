"use client";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminCouponsPage() {
  const { t } = useLocale();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code:"", type:"PERCENTAGE", value:"", minOrder:"", maxDiscount:"", usageLimit:"", expiresAt:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/coupons").then(r=>r.json()).then(d=>{ setCoupons(d.data||[]); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const res = await fetch("/api/admin/coupons", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, value:parseFloat(form.value), minOrder:form.minOrder?parseFloat(form.minOrder):null, maxDiscount:form.maxDiscount?parseFloat(form.maxDiscount):null, usageLimit:form.usageLimit?parseInt(form.usageLimit):null }) });
    const data = await res.json();
    if (data.success) { setCoupons(p=>[data.data,...p]); setShowForm(false); setForm({ code:"", type:"PERCENTAGE", value:"", minOrder:"", maxDiscount:"", usageLimit:"", expiresAt:"" }); }
    else setError(data.error);
    setSaving(false);
  }

  async function toggleCoupon(id: string, current: boolean) {
    await fetch(`/api/admin/coupons/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive: !current }) });
    setCoupons(p=>p.map(c=>c.id===id?{...c,isActive:!current}:c));
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Mã giảm giá")}</h1>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> {t("Tạo coupon")}
        </button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Mã coupon"),t("Loại"),t("Giá trị"),t("Đơn tối thiểu"),t("Đã dùng"),t("Hết hạn"),t("Trạng thái"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có coupon nào")}</td></tr>
            )}
            {coupons.map(c=>(
              <tr key={c.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:13.5, fontWeight:700, color:"var(--accent)", background:"var(--accent-soft)", padding:"3px 8px", borderRadius:6 }}>{c.code}</span>
                </td>
                <td style={{ padding:"12px 14px" }}><Badge color={c.type==="PERCENTAGE"?"blue":"green"}>{c.type==="PERCENTAGE"?"%":t("Cố định")}</Badge></td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
                  {c.type==="PERCENTAGE" ? `${c.value}%` : formatCurrency(c.value)}
                </td>
                <td style={{ padding:"12px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{c.minOrder ? formatCurrency(c.minOrder) : "—"}</td>
                <td style={{ padding:"12px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                <td style={{ padding:"12px 14px", fontSize:12, color:c.expiresAt && new Date(c.expiresAt) < new Date() ? "var(--red)" : "var(--text-muted)", whiteSpace:"nowrap" }}>
                  {c.expiresAt ? formatDate(c.expiresAt) : t("Vĩnh viễn")}
                </td>
                <td style={{ padding:"12px 14px" }}><Badge color={c.isActive?"green":"gray"}>{c.isActive?t("Đang bật"):t("Tắt")}</Badge></td>
                <td style={{ padding:"12px 14px" }}>
                  <button onClick={()=>toggleCoupon(c.id,c.isActive)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:c.isActive?"var(--red)":"var(--green)", fontSize:11.5, cursor:"pointer", fontWeight:600 }}>
                    {c.isActive?t("Tắt"):t("Bật")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:480, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{t("Tạo mã giảm giá")}</h3>
            <form onSubmit={save}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Mã coupon")}</label>
                  <input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="SUMMER2025" required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Loại")}</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{ ...inputStyle, cursor:"pointer" }}>
                    <option value="PERCENTAGE">{t("Phần trăm (%)")}</option>
                    <option value="FIXED">{t("Số tiền cố định")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Giá trị")}</label>
                  <input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))} placeholder={form.type==="PERCENTAGE"?"10":"50000"} required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Đơn tối thiểu")}</label>
                  <input type="number" value={form.minOrder} onChange={e=>setForm(p=>({...p,minOrder:e.target.value}))} placeholder="100000" style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Giới hạn lượt dùng")}</label>
                  <input type="number" value={form.usageLimit} onChange={e=>setForm(p=>({...p,usageLimit:e.target.value}))} placeholder={t("Không giới hạn")} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t("Ngày hết hạn")}</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={e=>setForm(p=>({...p,expiresAt:e.target.value}))} style={{ ...inputStyle, colorScheme:"dark" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              </div>
              {error && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  {saving?t("Đang tạo..."):t("Tạo coupon →")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
