"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminHostingPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serverId:"", name:"", slug:"", storage:1000, bandwidth:10000, databases:10, emailAccounts:100, subdomains:10, priceMonthly:"", priceYearly:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/hosting-packages").then(r=>r.json()),
      fetch("/api/admin/servers").then(r=>r.json()),
    ]).then(([p, s]) => { setPackages(p.data||[]); setServers(s.data||[]); setLoading(false); });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/hosting-packages", { method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ ...form, priceMonthly:parseFloat(form.priceMonthly), priceYearly:form.priceYearly?parseFloat(form.priceYearly):null }) });
    const data = await res.json();
    if (data.success) { setPackages(p=>[data.data,...p]); setShowForm(false); }
    setSaving(false);
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Gói Hosting</h1>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> Thêm gói
        </button>
      </div>
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Tên gói","Server","Tài nguyên","Giá/tháng","Trạng thái",""].map(h=>(
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
                <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-secondary)" }}>{pkg.server?.name||"—"}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span>{(pkg.storage/1024).toFixed(0)}GB Disk</span>
                    <span>{pkg.databases===0?"∞":pkg.databases} DB</span>
                    <span>{pkg.emailAccounts===0?"∞":pkg.emailAccounts} Email</span>
                  </div>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(pkg.priceMonthly)}</td>
                <td style={{ padding:"12px 16px" }}><Badge color={pkg.isActive?"green":"gray"}>{pkg.isActive?"Hoạt động":"Ẩn"}</Badge></td>
                <td style={{ padding:"12px 16px" }}>
                  <button onClick={async()=>{ await fetch(`/api/admin/hosting-packages/${pkg.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!pkg.isActive})}); setPackages(p=>p.map(x=>x.id===pkg.id?{...x,isActive:!pkg.isActive}:x)); }} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:pkg.isActive?"var(--red)":"var(--green)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                    {pkg.isActive?"Ẩn":"Hiện"}
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
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Thêm gói Hosting</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Server WHM</label>
                <select value={form.serverId} onChange={e=>setForm(p=>({...p,serverId:e.target.value}))} style={{ ...inputStyle, cursor:"pointer" }}>
                  <option value="">Chọn server...</option>
                  {servers.map((s:any)=><option key={s.id} value={s.id}>{s.name} ({s.whmHost})</option>)}
                </select>
              </div>
              {[
                { label:"Tên gói", key:"name", type:"text", ph:"Starter" },
                { label:"Slug", key:"slug", type:"text", ph:"starter" },
                { label:"Disk (MB)", key:"storage", type:"number", ph:"1000" },
                { label:"Bandwidth (MB)", key:"bandwidth", type:"number", ph:"10000" },
                { label:"Database", key:"databases", type:"number", ph:"10 (0=∞)" },
                { label:"Email", key:"emailAccounts", type:"number", ph:"100 (0=∞)" },
                { label:"Giá/tháng", key:"priceMonthly", type:"number", ph:"49000" },
                { label:"Giá/năm", key:"priceYearly", type:"number", ph:"490000" },
              ].map(f=>(
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:f.type==="number"?e.target.value:e.target.value}))} style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
              <button onClick={save} disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {saving?"Đang lưu...":"Tạo gói →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
