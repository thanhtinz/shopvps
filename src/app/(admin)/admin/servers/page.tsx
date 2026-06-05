"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", hostname:"", whmHost:"", whmPort:"2087", whmUser:"root", whmToken:"", maxAccounts:"100" });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string|null>(null);
  const [testResult, setTestResult] = useState<Record<string,{ok:boolean;msg:string}>>({});

  useEffect(() => {
    fetch("/api/admin/servers").then(r=>r.json()).then(d=>{ setServers(d.data||[]); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/admin/servers", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, whmPort:parseInt(form.whmPort), maxAccounts:parseInt(form.maxAccounts) }) });
    const data = await res.json();
    if (data.success) { setServers(p=>[data.data,...p]); setShowForm(false); setForm({ name:"", hostname:"", whmHost:"", whmPort:"2087", whmUser:"root", whmToken:"", maxAccounts:"100" }); }
    setSaving(false);
  }

  async function testConnection(id: string) {
    setTesting(id);
    const res = await fetch(`/api/admin/servers/${id}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"test" }) });
    const data = await res.json();
    setTestResult(p=>({ ...p, [id]: { ok: data.success, msg: data.success ? `WHM v${data.data?.version}` : data.error } }));
    setTesting(null);
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:2 }}>WHM Servers</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>Quản lý các server WHM/cPanel</p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> Thêm server
        </button>
      </div>

      {servers.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>Chưa có server nào</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:24 }}>Thêm server WHM để bắt đầu bán hosting</p>
          <button onClick={()=>setShowForm(true)} style={{ padding:"10px 24px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer" }}>Thêm server ngay</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {servers.map(s => (
            <div key={s.id} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:"var(--radius-md)", background:s.isActive?"var(--green-soft)":"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                    {s.isActive?"":""}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{s.name}</div>
                    <div style={{ fontSize:12.5, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{s.whmHost}:{s.whmPort}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted)" }}>User: {s.whmUser} · Max accounts: {s.maxAccounts}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {testResult[s.id] && (
                    <span style={{ fontSize:12, fontWeight:600, color:testResult[s.id].ok?"var(--green)":"var(--red)", background:testResult[s.id].ok?"var(--green-soft)":"var(--red-soft)", padding:"4px 10px", borderRadius:99 }}>
                      {testResult[s.id].ok ? "&#10003; " : "&#10007; "}{testResult[s.id].msg}
                    </span>
                  )}
                  <button onClick={()=>testConnection(s.id)} disabled={testing===s.id} style={{ padding:"7px 14px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--accent)", fontSize:12.5, cursor:"pointer", fontWeight:600 }}>
                    {testing===s.id?"Đang test...":"Test kết nối"}
                  </button>
                  <Badge color={s.isActive?"green":"gray"}>{s.isActive?"Hoạt động":"Tắt"}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:500, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Thêm WHM Server</h3>
            <form onSubmit={save}>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
                {[
                  { label:"Tên server", key:"name", ph:"Server VN #1" },
                  { label:"WHM Host", key:"whmHost", ph:"server.example.com" },
                  { label:"WHM Port", key:"whmPort", ph:"2087" },
                  { label:"WHM Username", key:"whmUser", ph:"root" },
                  { label:"WHM API Token", key:"whmToken", ph:"••••••••••••" },
                  { label:"Max accounts", key:"maxAccounts", ph:"100" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</label>
                    <input type={f.key==="whmToken"?"password":"text"} placeholder={f.ph} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required={["name","whmHost","whmUser","whmToken"].includes(f.key)} style={inputStyle}
                      onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  </div>
                ))}
              </div>
              <div style={{ background:"var(--yellow-soft)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--yellow)" }}>
                ⚠ WHM API Token được mã hoá AES-256 trước khi lưu DB
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  {saving?"Đang lưu...":"Thêm server →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
