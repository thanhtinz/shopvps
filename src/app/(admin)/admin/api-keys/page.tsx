"use client";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId:"", name:"" });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/api-keys").then(r=>r.json()),
      fetch("/api/admin/users").then(r=>r.json()),
    ]).then(([k, u]) => { setKeys(k.data||[]); setUsers(u.data?.users||[]); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/admin/api-keys", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setNewKey(data.data.key); setKeys(p=>[data.data,...p]); setShowForm(false); }
    setSaving(false);
  }

  async function revoke(id: string) {
    await fetch(`/api/admin/api-keys/${id}`, { method:"DELETE" });
    setKeys(p=>p.filter(k=>k.id!==id));
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>API Keys</h1>
        <button onClick={()=>setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> Tạo API Key
        </button>
      </div>

      {newKey && (
        <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:"var(--radius-lg)", padding:"16px 20px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", marginBottom:6 }}>&#10003; API Key đã tạo — Lưu lại ngay, chỉ hiển thị 1 lần!</div>
          <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:"var(--radius-md)", padding:"10px 14px", fontFamily:"var(--font-mono)", fontSize:13, color:"#e8edf5", letterSpacing:"0.02em", wordBreak:"break-all" }}>{newKey}</div>
          <button onClick={()=>{ navigator.clipboard.writeText(newKey); }} style={{ marginTop:8, padding:"6px 14px", background:"var(--green)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12, cursor:"pointer", fontWeight:600 }}>Copy key</button>
        </div>
      )}

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
            {["Tên","Người dùng","Key (ẩn)","Lần dùng cuối","Tạo lúc",""].map(h=>(
              <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {keys.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>Chưa có API key nào</td></tr>}
            {keys.map(k=>(
              <tr key={k.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{k.name}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:12.5, color:"var(--text-primary)" }}>{k.user?.name||"—"}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>{k.user?.email}</div>
                </td>
                <td style={{ padding:"12px 16px", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-muted)" }}>sk_••••••{k.key?.slice(-6)}</td>
                <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Chưa dùng"}</td>
                <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>{formatDate(k.createdAt)}</td>
                <td style={{ padding:"12px 16px" }}>
                  <button onClick={()=>{ if(confirm("Revoke key này?")) revoke(k.id); }} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer", fontWeight:600 }}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:440, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Tạo API Key mới</h3>
            <form onSubmit={save}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Người dùng</label>
                <select value={form.userId} onChange={e=>setForm(p=>({...p,userId:e.target.value}))} required style={{ ...inputStyle, cursor:"pointer" }}>
                  <option value="">Chọn người dùng...</option>
                  {users.map((u:any)=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>Tên key</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Production API Key" required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{saving?"Đang tạo...":"Tạo API Key →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
