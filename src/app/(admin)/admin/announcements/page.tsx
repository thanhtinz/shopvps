"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const TYPES = [
  { key: "info", label: "Thông tin", color: "blue" as const },
  { key: "success", label: "Thành công", color: "green" as const },
  { key: "warning", label: "Cảnh báo", color: "yellow" as const },
  { key: "danger", label: "Khẩn", color: "red" as const },
];

const empty = { title: "", content: "", type: "info", isActive: true, isPopup: false, expiresAt: "" };

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null); // null = closed, {} = new
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/admin/announcements").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  function open(item: any) {
    if (item) { setForm({ ...item, expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0,16) : "" }); setEditing(item); }
    else { setForm(empty); setEditing({}); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, expiresAt: form.expiresAt || null };
    const isNew = !editing?.id;
    await fetch(isNew ? "/api/admin/announcements" : `/api/admin/announcements/${editing.id}`, {
      method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setSaving(false); setEditing(null); load();
  }

  async function toggle(item: any) {
    await fetch(`/api/admin/announcements/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive: !item.isActive }) });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Xoá thông báo này?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method:"DELETE" });
    load();
  }

  const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Thông báo ({items.length})</h1>
        <button onClick={()=>open(null)} style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Tạo thông báo</button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:240, margin:16, borderRadius:"var(--radius-md)" }}/> : items.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>Chưa có thông báo nào</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Tiêu đề","Loại","Popup","Trạng thái","Hết hạn","Thao tác"].map(h=>(
                <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(a=>{
                const t = TYPES.find(x=>x.key===a.type) || TYPES[0];
                return (
                  <tr key={a.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"12px 16px", maxWidth:320 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                      <div style={{ fontSize:11.5, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.content}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}><Badge color={t.color}>{t.label}</Badge></td>
                    <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-secondary)" }}>{a.isPopup ? "Có" : "—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <button onClick={()=>toggle(a)} style={{ cursor:"pointer", border:"none", background:"transparent" }}>
                        <Badge color={a.isActive ? "green" : "gray"}>{a.isActive ? "Hiển thị" : "Ẩn"}</Badge>
                      </button>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{a.expiresAt ? formatDate(a.expiresAt) : "—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>open(a)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12, cursor:"pointer" }}>Sửa</button>
                        <button onClick={()=>remove(a.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>Xoá</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setEditing(null)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:520, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{editing.id ? "Sửa thông báo" : "Tạo thông báo"}</h3>
            <form onSubmit={save}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Tiêu đề</label>
                <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required style={inputStyle as any}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Nội dung</label>
                <textarea value={form.content} onChange={e=>setForm({...form, content:e.target.value})} required rows={4} style={{...inputStyle as any, resize:"vertical"}}/>
              </div>
              <div style={{ display:"flex", gap:14, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Loại</label>
                  <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} style={inputStyle as any}>
                    {TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Hết hạn (tuỳ chọn)</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={e=>setForm({...form, expiresAt:e.target.value})} style={inputStyle as any}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:20, marginBottom:22 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})}/> Hiển thị ngay
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.isPopup} onChange={e=>setForm({...form, isPopup:e.target.checked})}/> Hiện popup
                </label>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setEditing(null)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{saving?"Đang lưu...":"Lưu"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
