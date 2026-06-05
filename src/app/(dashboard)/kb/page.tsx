"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function KbPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => { fetch("/api/kb").then(r=>r.json()).then(d=>{ setCats(d.data||[]); setLoading(false); }); }, []);

  const ql = q.trim().toLowerCase();
  const filtered = cats
    .map(c => ({ ...c, articles: ql ? c.articles.filter((a:any)=>a.title.toLowerCase().includes(ql)) : c.articles }))
    .filter(c => !ql || c.articles.length > 0);

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:4 }}>Cơ sở tri thức</h1>
      <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>Hướng dẫn và câu hỏi thường gặp</p>

      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm bài viết..." style={{ width:"100%", boxSizing:"border-box", background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"12px 16px", color:"var(--text-primary)", fontSize:14, outline:"none", marginBottom:24 }}/>

      {loading ? <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/> : filtered.length===0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>Chưa có bài viết nào</div>
      ) : (
        <div style={{ display:"grid", gap:16 }}>
          {filtered.map(c=>(
            <div key={c.id} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{c.name}</div>
              {c.articles.length===0 ? (
                <div style={{ padding:"18px", color:"var(--text-muted)", fontSize:13 }}>Chưa có bài viết</div>
              ) : c.articles.map((a:any)=>(
                <Link key={a.id} href={`/kb/${a.slug}`} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 18px", borderBottom:"1px solid var(--border)", textDecoration:"none", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                  <span style={{ fontSize:13.5, color:"var(--text-primary)" }}>{a.title}</span>
                  <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{a.views} lượt xem →</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
