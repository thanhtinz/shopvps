"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";

export default function AdminKbPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selCat, setSelCat] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<any>(null); // article modal: null closed, {} new
  const [form, setForm] = useState<any>({ title: "", content: "", isPublished: true });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/admin/kb/categories").then(r=>r.json()).then(d=>{
    setCats(d.data||[]); setLoading(false);
    setSelCat(prev => prev || d.data?.[0]?.id || null);
  });
  useEffect(() => { load(); }, []);

  async function addCat(e: React.FormEvent) {
    e.preventDefault(); if (!newCat.trim()) return;
    const res = await fetch("/api/admin/kb/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:newCat }) });
    const d = await res.json(); setNewCat(""); await load(); if (d.data?.id) setSelCat(d.data.id);
  }
  async function delCat(id: string) {
    if (!confirm("Xoá danh mục và toàn bộ bài viết bên trong?")) return;
    await fetch(`/api/admin/kb/categories/${id}`, { method:"DELETE" }); setSelCat(null); load();
  }
  function openArticle(a: any) {
    if (a) { setForm({ title:a.title, content:a.content, isPublished:a.isPublished }); setEditing(a); }
    else { setForm({ title:"", content:"", isPublished:true }); setEditing({}); }
  }
  async function saveArticle(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const isNew = !editing?.id;
    await fetch(isNew ? "/api/admin/kb/articles" : `/api/admin/kb/articles/${editing.id}`, {
      method: isNew ? "POST" : "PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(isNew ? { ...form, categoryId: selCat } : form),
    });
    setSaving(false); setEditing(null); load();
  }
  async function delArticle(id: string) {
    if (!confirm("Xoá bài viết này?")) return;
    await fetch(`/api/admin/kb/articles/${id}`, { method:"DELETE" }); load();
  }

  const category = cats.find(c=>c.id===selCat);
  const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>Knowledgebase</h1>
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
        {/* Categories */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", height:"fit-content" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>Danh mục</div>
          <div>
            {cats.map(c=>(
              <div key={c.id} onClick={()=>setSelCat(c.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom:"1px solid var(--border)", cursor:"pointer", background: selCat===c.id?"var(--accent-soft)":"transparent" }}>
                <span style={{ fontSize:13, fontWeight:600, color:selCat===c.id?"var(--accent)":"var(--text-primary)" }}>{c.name}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>{c.articles?.length||0}</span>
                  <button onClick={e=>{e.stopPropagation(); delCat(c.id);}} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={addCat} style={{ padding:"12px 16px", display:"flex", gap:8 }}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Danh mục mới..." style={{ ...inputStyle as any, padding:"8px 10px", fontSize:12.5 }}/>
            <button type="submit" style={{ padding:"8px 12px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>+</button>
          </form>
        </div>

        {/* Articles */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{category ? `Bài viết · ${category.name}` : "Chọn danh mục"}</span>
            {category && <button onClick={()=>openArticle(null)} style={{ padding:"7px 14px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>+ Bài viết</button>}
          </div>
          <div>
            {!category || category.articles?.length===0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)", fontSize:13 }}>{category ? "Chưa có bài viết" : "Tạo/chọn một danh mục"}</div>
            ) : category.articles.map((a:any)=>(
              <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{a.title}</div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{a.views} lượt xem</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Badge color={a.isPublished?"green":"gray"}>{a.isPublished?"Đăng":"Nháp"}</Badge>
                  <button onClick={()=>openArticle(a)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12, cursor:"pointer" }}>Sửa</button>
                  <button onClick={()=>delArticle(a.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>Xoá</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setEditing(null)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:620, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{editing.id?"Sửa bài viết":"Bài viết mới"}</h3>
            <form onSubmit={saveArticle}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Tiêu đề</label>
                <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required style={inputStyle as any}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Nội dung (hỗ trợ xuống dòng)</label>
                <textarea value={form.content} onChange={e=>setForm({...form, content:e.target.value})} required rows={10} style={{...inputStyle as any, resize:"vertical", lineHeight:1.6}}/>
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer", marginBottom:22 }}>
                <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form, isPublished:e.target.checked})}/> Xuất bản (hiển thị cho khách)
              </label>
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
