"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };
const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:5 };

type GroupDef = { id: string; label: string };
type TypeDef = { group: string; type: string; label: string; autoActivate?: boolean };

export default function AdminProductsPage() {
  const { t } = useLocale();
  const [groups, setGroups] = useState<GroupDef[]>([]);
  const [types, setTypes] = useState<TypeDef[]>([]);
  const groupLabel = (id: string) => groups.find(g=>g.id===id)?.label ?? id;
  const typeLabel = (slug: string) => types.find(tp=>tp.type===slug)?.label ?? slug;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const emptyForm = { group:"", category:"", name:"", slug:"", description:"", priceMonthly:"", priceYearly:"", setupFee:"", stock:"", sortOrder:"", specs:"", autoActivate:false, isActive:true };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const d = await fetch("/api/admin/products").then(r=>r.json());
    setProducts(d.data||[]); setLoading(false);
  }
  useEffect(() => {
    fetch("/api/products/taxonomy").then(r=>r.json()).then(d=>{
      setGroups(d.data?.groups||[]); setTypes(d.data?.types||[]);
    });
    load();
  }, []);

  function openCreate() {
    setEditId(null); setForm(emptyForm); setError(""); setShowForm(true);
  }
  function openEdit(p: any) {
    setEditId(p.id); setError("");
    setForm({
      group: p.group ?? "",
      category: p.category,
      name: p.name ?? "",
      slug: p.slug ?? "",
      description: p.description ?? "",
      priceMonthly: p.priceMonthly?.toString() ?? "",
      priceYearly: p.priceYearly?.toString() ?? "",
      setupFee: p.setupFee?.toString() ?? "",
      stock: p.stock==null ? "" : p.stock.toString(),
      sortOrder: p.sortOrder?.toString() ?? "",
      specs: p.specs ? JSON.stringify(p.specs, null, 2) : "",
      autoActivate: !!p.autoActivate,
      isActive: !!p.isActive,
    });
    setShowForm(true);
  }

  function pickGroup(groupId: string) {
    setForm(p=>({ ...p, group:groupId, category:"" }));
  }
  function pickType(slug: string) {
    const td = types.find(tp=>tp.type===slug);
    setForm(p=>({ ...p, category:slug, autoActivate: td ? !!td.autoActivate : p.autoActivate }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const body: any = {
      name: form.name,
      description: form.description || null,
      priceMonthly: parseFloat(form.priceMonthly),
      priceYearly: form.priceYearly ? parseFloat(form.priceYearly) : null,
      setupFee: form.setupFee ? parseFloat(form.setupFee) : 0,
      stock: form.stock === "" ? null : parseInt(form.stock),
      sortOrder: form.sortOrder ? parseInt(form.sortOrder) : 0,
      specs: form.specs,
      autoActivate: form.autoActivate,
      isActive: form.isActive,
    };
    if (form.slug) body.slug = form.slug;
    let res;
    if (editId) {
      res = await fetch(`/api/admin/products/${editId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    } else {
      body.category = form.category;
      res = await fetch("/api/admin/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    }
    const data = await res.json();
    if (res.ok && data.success !== false) { setShowForm(false); setForm(emptyForm); setEditId(null); await load(); }
    else setError(data.error || t("Đã xảy ra lỗi"));
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm(t("Xoá sản phẩm này?"))) return;
    await fetch(`/api/admin/products/${id}`, { method:"DELETE" });
    await load();
  }

  const shown = filter ? products.filter(p=>p.group===filter) : products;
  const typesForGroup = types.filter(tp=>tp.group===form.group);

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Sản phẩm")}</h1>
        <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> {t("Tạo sản phẩm")}
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[{v:"",l:t("Tất cả")}, ...groups.map(g=>({v:g.id,l:g.label}))].map(o=>(
          <button key={o.v} onClick={()=>setFilter(o.v)} style={{ padding:"7px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:filter===o.v?"var(--accent)":"var(--bg-elevated)", color:filter===o.v?"white":"var(--text-secondary)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>{o.l}</button>
        ))}
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Tên"),t("Giá/tháng"),t("Phí cài đặt"),t("Kho"),t("Trạng thái"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có sản phẩm nào")}</td></tr>
            )}
            {shown.map(p=>(
              <tr key={p.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{groupLabel(p.group)} · {typeLabel(p.category)}</div>
                </td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(p.priceMonthly)}</td>
                <td style={{ padding:"12px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{formatCurrency(p.setupFee)}</td>
                <td style={{ padding:"12px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{p.stock ?? "∞"}</td>
                <td style={{ padding:"12px 14px" }}><Badge color={p.isActive?"green":"gray"}>{p.isActive?t("Đang bật"):t("Tắt")}</Badge></td>
                <td style={{ padding:"12px 14px", whiteSpace:"nowrap" }}>
                  <button onClick={()=>openEdit(p)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:11.5, cursor:"pointer", fontWeight:600, marginRight:6 }}>{t("Sửa")}</button>
                  <button onClick={()=>remove(p.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:11.5, cursor:"pointer", fontWeight:600 }}>{t("Xoá")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowForm(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:520, maxWidth:"90vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{editId?t("Sửa sản phẩm"):t("Tạo sản phẩm")}</h3>
            <form onSubmit={save}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}>{t("Nhóm")}</label>
                  <select value={form.group} disabled={!!editId} onChange={e=>pickGroup(e.target.value)} style={{ ...inputStyle, cursor:editId?"not-allowed":"pointer", opacity:editId?0.6:1 }}>
                    <option value="">—</option>
                    {groups.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{t("Loại")}</label>
                  <select value={form.category} disabled={!!editId} onChange={e=>pickType(e.target.value)} required style={{ ...inputStyle, cursor:editId?"not-allowed":"pointer", opacity:editId?0.6:1 }}>
                    <option value="">—</option>
                    {typesForGroup.map(tp=><option key={tp.type} value={tp.type}>{tp.label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>{t("Tên")}</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>{t("Mô tả")}</label>
                  <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Giá/tháng")}</label>
                  <input type="number" value={form.priceMonthly} onChange={e=>setForm(p=>({...p,priceMonthly:e.target.value}))} required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Giá/năm")}</label>
                  <input type="number" value={form.priceYearly} onChange={e=>setForm(p=>({...p,priceYearly:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Phí cài đặt")}</label>
                  <input type="number" value={form.setupFee} onChange={e=>setForm(p=>({...p,setupFee:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Tồn kho (trống = không giới hạn)")}</label>
                  <input type="number" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("Sắp xếp")}</label>
                  <input type="number" value={form.sortOrder} onChange={e=>setForm(p=>({...p,sortOrder:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelStyle}>{t("Thông số kỹ thuật (JSON)")}</label>
                  <textarea value={form.specs} onChange={e=>setForm(p=>({...p,specs:e.target.value}))} rows={5} placeholder='{"cpu":"Xeon E5","ram":"32GB","disk":"2x1TB"}' style={{ ...inputStyle, resize:"vertical", fontFamily:"var(--font-mono)" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
                    <input type="checkbox" checked={form.autoActivate} onChange={e=>setForm(p=>({...p,autoActivate:e.target.checked}))}/>
                    {t("Tự động kích hoạt khi mua")}
                  </label>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
                    <input type="checkbox" checked={form.isActive} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))}/>
                    {t("Kích hoạt")}
                  </label>
                </div>
              </div>
              {error && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
                <button type="submit" disabled={saving} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  {saving?t("Đang lưu..."):t("Lưu")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
