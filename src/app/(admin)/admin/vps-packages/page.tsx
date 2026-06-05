"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminVpsPackagesPage() {
  const { t } = useLocale();
  const [packages, setPackages] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ providerId:"", name:"", slug:"", cpu:1, ram:1, storage:25, bandwidth:1000, priceMonthly:"", priceYearly:"", isActive:true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/vps-packages").then(r=>r.json()),
    ]).then(([p]) => { setPackages(p.data||[]); setLoading(false); });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/vps-packages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, priceMonthly: parseFloat(form.priceMonthly), priceYearly: form.priceYearly ? parseFloat(form.priceYearly) : null }) });
    const data = await res.json();
    if (data.success) { setPackages(p=>[data.data,...p]); setShowForm(false); }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/vps-packages/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive: !current }) });
    setPackages(p=>p.map(pkg=>pkg.id===id?{...pkg,isActive:!current}:pkg));
  }

  if (loading) return <div><div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/></div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Gói VPS")}</h1>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <Icon d="M12 5v14 M5 12h14"/> {t("Thêm gói mới")}
        </button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Tên gói"),t("Provider"),t("Cấu hình"),t("Giá/tháng"),t("Trạng thái"),t("Thao tác")].map(h=>(
                <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg=>(
              <tr key={pkg.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{pkg.name}</div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{pkg.slug}</div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-secondary)" }}>{pkg.provider?.name||"—"}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", gap:12 }}>
                    <span>{pkg.cpu} vCPU</span><span>{pkg.ram}GB RAM</span><span>{pkg.storage}GB SSD</span>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(pkg.priceMonthly)}</td>
                <td style={{ padding:"12px 16px" }}><Badge color={pkg.isActive?"green":"gray"}>{pkg.isActive?t("Hoạt động"):t("Ẩn")}</Badge></td>
                <td style={{ padding:"12px 16px" }}>
                  <button onClick={()=>toggleActive(pkg.id, pkg.isActive)} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:pkg.isActive?"var(--red)":"var(--green)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                    {pkg.isActive?t("Ẩn"):t("Hiện")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:520, maxWidth:"90vw", maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{t("Thêm gói VPS mới")}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[
                { label:t("Tên gói"), key:"name", type:"text", ph:"Cloud Compute 1" },
                { label:t("Slug"), key:"slug", type:"text", ph:"vc2-1c-1gb" },
                { label:t("CPU (vCore)"), key:"cpu", type:"number", ph:"1" },
                { label:t("RAM (GB)"), key:"ram", type:"number", ph:"1" },
                { label:t("Storage (GB)"), key:"storage", type:"number", ph:"25" },
                { label:t("Bandwidth (GB)"), key:"bandwidth", type:"number", ph:"1000" },
                { label:t("Giá/tháng (VNĐ)"), key:"priceMonthly", type:"number", ph:"99000" },
                { label:t("Giá/năm (VNĐ)"), key:"priceYearly", type:"number", ph:"990000" },
              ].map(f=>(
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.type==="number"?e.target.value:e.target.value}))} style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
              <button onClick={save} disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {saving?t("Đang lưu..."):t("Tạo gói →")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
