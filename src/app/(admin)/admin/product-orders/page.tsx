"use client";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };
const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:5 };

const STATUSES = ["PENDING","ACTIVE","SUSPENDED","TERMINATED"] as const;

export default function AdminProductOrdersPage() {
  const { t } = useLocale();
  const catLabel = (c: string) => c==="DEDICATED" ? t("Máy chủ vật lý") : c==="PROXY" ? t("Proxy") : t("Cronjob");
  const statusLabel = (s: string) => s==="PENDING" ? t("Chờ kích hoạt") : s==="ACTIVE" ? t("Đang hoạt động") : s==="SUSPENDED" ? t("Tạm dừng") : t("Đã huỷ");
  const statusColor = (s: string): any => s==="ACTIVE" ? "green" : s==="PENDING" ? "yellow" : s==="SUSPENDED" ? "gray" : "red";

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [active, setActive] = useState<any|null>(null);
  const [form, setForm] = useState({ status:"", credentials:"", notes:"", data:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(cat: string) {
    setLoading(true);
    const d = await fetch(`/api/admin/product-orders?category=${cat}`).then(r=>r.json());
    setOrders(d.data||[]); setLoading(false);
  }
  useEffect(() => { load(filter); }, [filter]);

  function openManage(o: any) {
    setActive(o); setError("");
    setForm({ status:o.status, credentials:"", notes:o.notes ?? "", data:o.data ? (typeof o.data==="string"?o.data:JSON.stringify(o.data,null,2)) : "" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!active) return;
    setSaving(true); setError("");
    const body: any = {};
    if (form.status !== active.status) body.status = form.status;
    if (form.credentials) body.credentials = form.credentials;
    if (form.notes !== (active.notes ?? "")) body.notes = form.notes;
    if (form.data) body.data = form.data;
    const res = await fetch(`/api/admin/product-orders/${active.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const data = await res.json();
    if (res.ok && data.success !== false) { setActive(null); await load(filter); }
    else setError(data.error || t("Đã xảy ra lỗi"));
    setSaving(false);
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Đơn sản phẩm")}</h1>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{v:"",l:t("Tất cả")},{v:"DEDICATED",l:t("Máy chủ vật lý")},{v:"PROXY",l:t("Proxy")},{v:"CRONJOB",l:t("Cronjob")}].map(o=>(
          <button key={o.v} onClick={()=>setFilter(o.v)} style={{ padding:"7px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:filter===o.v?"var(--accent)":"var(--bg-elevated)", color:filter===o.v?"white":"var(--text-secondary)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>{o.l}</button>
        ))}
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Khách hàng"),t("Sản phẩm"),t("Danh mục"),t("Giá"),t("Trạng thái"),t("Ngày tạo"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có đơn nào")}</td></tr>
            )}
            {orders.map(o=>(
              <tr key={o.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{o.user?.name || o.user?.email}</div>
                  {o.user?.name && <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{o.user?.email}</div>}
                </td>
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{o.product?.name}</div>
                  {o.label && <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{o.label}</div>}
                </td>
                <td style={{ padding:"12px 14px" }}><Badge color={o.category==="DEDICATED"?"purple":o.category==="PROXY"?"cyan":"blue"}>{catLabel(o.category)}</Badge></td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(o.price)}</td>
                <td style={{ padding:"12px 14px" }}><Badge color={statusColor(o.status)}>{statusLabel(o.status)}</Badge></td>
                <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(o.createdAt)}</td>
                <td style={{ padding:"12px 14px" }}>
                  <button onClick={()=>openManage(o)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--accent)", fontSize:11.5, cursor:"pointer", fontWeight:600 }}>{t("Quản lý")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setActive(null)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:520, maxWidth:"90vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>{t("Quản lý")}</h3>
            <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:6 }}>{active.product?.name}{active.label?` · ${active.label}`:""}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:20 }}>{active.user?.name || active.user?.email} · {formatCurrency(active.price)}</div>
            <form onSubmit={save}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:14, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}>{t("Trạng thái")}</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{ ...inputStyle, cursor:"pointer" }}>
                    {STATUSES.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)", marginBottom:8, lineHeight:1.5 }}>{t("Đặt trạng thái = Đang hoạt động để kích hoạt và thông báo cho khách.")}</div>
                  <label style={labelStyle}>{t("Thông tin truy cập / Proxy (gửi cho khách)")}</label>
                  <textarea value={form.credentials} onChange={e=>setForm(p=>({...p,credentials:e.target.value}))} rows={4} style={{ ...inputStyle, resize:"vertical", fontFamily:"var(--font-mono)" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Ghi chú")}</label>
                  <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Dữ liệu (JSON)")}</label>
                  <textarea value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} rows={3} style={{ ...inputStyle, resize:"vertical", fontFamily:"var(--font-mono)" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              </div>
              {error && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setActive(null)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  {saving?t("Đang lưu..."):t("Lưu")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
