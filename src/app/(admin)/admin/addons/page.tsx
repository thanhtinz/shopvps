"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const empty = { name: "", description: "", scope: "both", priceMonthly: "", isActive: true };
const scopeLabel: Record<string, string> = { vps: "VPS", hosting: "Hosting", both: "VPS + Hosting" };

export default function AdminAddonsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);

  const load = () => fetch("/api/admin/addons").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/addons", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    setOpen(false); setForm(empty); load();
  }
  async function patch(id: string, data: any) {
    await fetch(`/api/admin/addons/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Xoá add-on này?")) return;
    await fetch(`/api/admin/addons/${id}`, { method:"DELETE" }); load();
  }

  const inp = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Add-on / Tuỳ chọn</h1>
          <p style={{ fontSize:12.5, color:"var(--text-muted)", marginTop:2 }}>Khách chọn thêm khi đặt VPS/Hosting (giá tính theo chu kỳ)</p>
        </div>
        <button onClick={()=>setOpen(true)} style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Thêm add-on</button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:200, margin:16, borderRadius:"var(--radius-md)" }}/> : items.length===0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)", fontSize:13 }}>Chưa có add-on nào</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Tên","Phạm vi","Giá/tháng","Trạng thái",""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(a=>(
                <tr key={a.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>{a.name}</div>
                    {a.description && <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{a.description}</div>}
                  </td>
                  <td style={{ padding:"11px 14px" }}><Badge color="blue">{scopeLabel[a.scope]||a.scope}</Badge></td>
                  <td style={{ padding:"11px 14px" }}>
                    <input type="number" defaultValue={Number(a.priceMonthly)} onBlur={e=>{ const v=parseFloat(e.target.value); if(v!==Number(a.priceMonthly)) patch(a.id,{priceMonthly:v}); }} style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"6px 8px", color:"var(--text-primary)", fontSize:12.5, outline:"none", width:120 }}/>
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>patch(a.id,{ isActive: !a.isActive })} style={{ border:"none", background:"transparent", cursor:"pointer" }}>
                      <Badge color={a.isActive?"green":"gray"}>{a.isActive?"Bật":"Tắt"}</Badge>
                    </button>
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>remove(a.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setOpen(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:440, maxWidth:"92vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:18 }}>Thêm add-on</h3>
            <form onSubmit={add} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tên (vd: +2GB RAM)" required style={inp as any}/>
              <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Mô tả (tuỳ chọn)" style={inp as any}/>
              <div style={{ display:"flex", gap:10 }}>
                <select value={form.scope} onChange={e=>setForm({...form,scope:e.target.value})} style={{ ...inp as any, flex:1 }}>
                  <option value="both">VPS + Hosting</option>
                  <option value="vps">Chỉ VPS</option>
                  <option value="hosting">Chỉ Hosting</option>
                </select>
                <input type="number" value={form.priceMonthly} onChange={e=>setForm({...form,priceMonthly:e.target.value})} placeholder="Giá/tháng" required style={{ ...inp as any, flex:1 }}/>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:6 }}>
                <button type="button" onClick={()=>setOpen(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
