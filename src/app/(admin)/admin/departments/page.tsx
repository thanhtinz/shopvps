"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminDepartmentsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const load = () => fetch("/api/admin/departments").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    await fetch("/api/admin/departments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name }) });
    setName(""); load();
  }
  async function patch(id: string, data: any) {
    await fetch(`/api/admin/departments/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    load();
  }
  async function remove(id: string) {
    if (!confirm(t("Xoá phòng ban?"))) return;
    await fetch(`/api/admin/departments/${id}`, { method:"DELETE" }); load();
  }

  return (
    <div style={{ maxWidth:640 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>{t("Phòng ban hỗ trợ")}</h1>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", marginBottom:16 }}>
        {loading ? <div className="skeleton" style={{ height:160, margin:16, borderRadius:"var(--radius-md)" }}/> : items.map(d=>(
          <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 18px", borderBottom:"1px solid var(--border)" }}>
            <span style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>{d.name}</span>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>patch(d.id,{ isActive: !d.isActive })} style={{ border:"none", background:"transparent", cursor:"pointer" }}>
                <Badge color={d.isActive?"green":"gray"}>{d.isActive?t("Bật"):t("Tắt")}</Badge>
              </button>
              <button onClick={()=>remove(d.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>{t("Xoá")}</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={add} style={{ display:"flex", gap:10 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("Tên phòng ban mới...")} style={{ flex:1, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none" }}/>
        <button type="submit" style={{ padding:"10px 18px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>{t("Thêm")}</button>
      </form>
    </div>
  );
}
