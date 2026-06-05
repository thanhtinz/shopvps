"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminEmailTemplatesPage() {
  const { t: tr } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/admin/email-templates").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/email-templates/${edit.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ subject: edit.subject, body: edit.body, isActive: edit.isActive }) });
    setSaving(false); setEdit(null); load();
  }

  const inp = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{tr("Mẫu email")}</h1>
        <p style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:2 }}>{tr("Dùng biến dạng")} {"{{name}}"}, {"{{service}}"}, {"{{amount}}"}{tr("… tuỳ mẫu")}</p>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {loading ? <div className="skeleton" style={{ height:200, borderRadius:"var(--radius-lg)" }}/> : items.map(t=>(
          <div key={t.id} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t.name}</span>
                <Badge color={t.isActive?"green":"gray"}>{t.isActive?tr("Bật"):tr("Tắt")}</Badge>
                <code style={{ fontSize:11, color:"var(--text-muted)" }}>{t.key}</code>
              </div>
              <div style={{ fontSize:12.5, color:"var(--text-secondary)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</div>
            </div>
            <button onClick={()=>setEdit({ ...t })} style={{ padding:"7px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12.5, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>{tr("Sửa")}</button>
          </div>
        ))}
      </div>

      {edit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setEdit(null)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:640, maxWidth:"94vw", maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{edit.name}</h3>
            <code style={{ fontSize:11.5, color:"var(--text-muted)" }}>{edit.key}</code>
            <div style={{ marginTop:16, marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{tr("Tiêu đề")}</label>
              <input value={edit.subject} onChange={e=>setEdit({...edit, subject:e.target.value})} style={inp as any}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{tr("Nội dung (HTML)")}</label>
              <textarea value={edit.body} onChange={e=>setEdit({...edit, body:e.target.value})} rows={10} style={{ ...inp as any, resize:"vertical", fontFamily:"monospace", fontSize:12.5, lineHeight:1.6 }}/>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer", marginBottom:20 }}>
              <input type="checkbox" checked={edit.isActive} onChange={e=>setEdit({...edit, isActive:e.target.checked})}/> {tr("Kích hoạt mẫu này")}
            </label>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setEdit(null)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{tr("Huỷ")}</button>
              <button onClick={save} disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{saving?tr("Đang lưu..."):tr("Lưu mẫu")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
