"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const empty = { tld: "", registerPrice: "", renewPrice: "", transferPrice: "", isActive: true };

export default function AdminTldsPage() {
  const { t: tr } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);

  const load = () => fetch("/api/admin/tlds").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/tlds", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    setOpen(false); setForm(empty); load();
  }
  async function patch(id: string, data: any) {
    await fetch(`/api/admin/tlds/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    load();
  }
  async function remove(id: string) {
    if (!confirm(tr("Xoá TLD này?"))) return;
    await fetch(`/api/admin/tlds/${id}`, { method:"DELETE" }); load();
  }

  const cell = { background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"6px 8px", color:"var(--text-primary)", fontSize:12.5, outline:"none", width:110 };
  const inp = { ...cell, width:"100%", boxSizing:"border-box" as const, padding:"10px 12px", fontSize:13.5 };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{tr("Bảng giá TLD")}</h1>
        <button onClick={()=>setOpen(true)} style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>{tr("+ Thêm TLD")}</button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:200, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["TLD",tr("Đăng ký"),tr("Gia hạn"),"Transfer",tr("Trạng thái"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(t=>(
                <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"10px 14px", fontSize:13.5, fontWeight:700, color:"var(--text-primary)" }}>{t.tld}</td>
                  {["registerPrice","renewPrice","transferPrice"].map(k=>(
                    <td key={k} style={{ padding:"10px 14px" }}>
                      <input type="number" defaultValue={Number(t[k])} onBlur={e=>{ const v=parseFloat(e.target.value); if(v!==Number(t[k])) patch(t.id,{[k]:v}); }} style={cell as any}/>
                    </td>
                  ))}
                  <td style={{ padding:"10px 14px" }}>
                    <button onClick={()=>patch(t.id,{ isActive: !t.isActive })} style={{ border:"none", background:"transparent", cursor:"pointer" }}>
                      <Badge color={t.isActive?"green":"gray"}>{t.isActive?tr("Bật"):tr("Tắt")}</Badge>
                    </button>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <button onClick={()=>remove(t.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>{tr("Xoá")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setOpen(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:420, maxWidth:"92vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:18 }}>{tr("Thêm TLD")}</h3>
            <form onSubmit={add} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["tld",tr("Đuôi (vd .com)")],["registerPrice",tr("Giá đăng ký")],["renewPrice",tr("Giá gia hạn")],["transferPrice",tr("Giá transfer")]].map(([k,l])=>(
                <div key={k}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>{l}</label>
                  <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={k==="tld"} type={k==="tld"?"text":"number"} style={inp as any}/>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button type="button" onClick={()=>setOpen(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{tr("Huỷ")}</button>
                <button type="submit" style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>{tr("Thêm")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
