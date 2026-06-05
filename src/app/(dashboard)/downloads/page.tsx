"use client";
import { useState, useEffect } from "react";

export default function DownloadsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/downloads").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); }); }, []);

  async function open(id: string) {
    const d = await fetch(`/api/downloads/${id}`).then(r=>r.json()).catch(()=>null);
    if (d?.data?.url) window.open(d.data.url, "_blank");
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:4 }}>Tải xuống</h1>
      <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>Tài liệu, phần mềm và công cụ</p>

      {loading ? <div className="skeleton" style={{ height:240, borderRadius:"var(--radius-lg)" }}/> : items.length===0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>Chưa có tệp nào</div>
      ) : categories.map(cat=>(
        <div key={cat} style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>{cat}</div>
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
            {items.filter(i=>i.category===cat).map(d=>(
              <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>{d.title}</div>
                  {d.description && <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{d.description}</div>}
                </div>
                <button onClick={()=>open(d.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12.5, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/></svg>
                  Tải
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
