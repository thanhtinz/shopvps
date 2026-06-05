"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", slug:"", apiKey:"", apiEndpoint:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/providers").then(r=>r.json()).then(d=>{ setProviders(d.data||[]); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/admin/providers", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setProviders(p=>[data.data,...p]); setShowForm(false); setForm({ name:"", slug:"", apiKey:"", apiEndpoint:"" }); }
    setSaving(false);
  }

  async function toggle(id: string, current: boolean) {
    await fetch(`/api/admin/providers/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive: !current }) });
    setProviders(p=>p.map(x=>x.id===id?{...x,isActive:!current}:x));
  }

  const slugMap: Record<string,string> = { vultr:"Vultr", hetzner:"Hetzner Cloud", digitalocean:"DigitalOcean", linode:"Linode/Akamai", ovh:"OVHcloud", upcloud:"UpCloud" };

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div><h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:2 }}>VPS Providers</h1><p style={{ color:"var(--text-muted)", fontSize:13 }}>Quản lý API keys nhà cung cấp VPS</p></div>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> Thêm provider
        </button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {providers.map(p=>(
          <div key={p.id} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:"var(--radius-md)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {p.slug==="vultr"?"":p.slug==="hetzner"?"":p.slug==="digitalocean"?"":p.slug==="linode"?"":""}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{p.name}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>slug: {p.slug} · API: {p.apiKey || "Chưa cấu hình"}</div>
            </div>
            <Badge color={p.isActive?"green":"gray"}>{p.isActive?"Active":"Inactive"}</Badge>
            <button onClick={()=>toggle(p.id,p.isActive)} style={{ padding:"6px 14px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:p.isActive?"var(--red)":"var(--green)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
              {p.isActive?"Tắt":"Bật"}
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:460, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Thêm VPS Provider</h3>
            <form onSubmit={save}>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Provider có sẵn</label>
                <select onChange={e=>{ const v=e.target.value; if(v) setForm(p=>({...p,name:slugMap[v]||v,slug:v})); }} style={{ ...inputStyle, cursor:"pointer" }}>
                  <option value="">Chọn hoặc nhập thủ công...</option>
                  {Object.entries(slugMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {[
                { label:"Tên hiển thị", key:"name", ph:"Vultr" },
                { label:"Slug", key:"slug", ph:"vultr" },
                { label:"API Key", key:"apiKey", ph:"••••••" },
                { label:"API Endpoint (tuỳ chọn)", key:"apiEndpoint", ph:"https://api.vultr.com/v2" },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:12 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</label>
                  <input type={f.key==="apiKey"?"password":"text"} placeholder={f.ph} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required={["name","slug"].includes(f.key)} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{saving?"Đang lưu...":"Thêm provider →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
