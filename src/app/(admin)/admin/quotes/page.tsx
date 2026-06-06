"use client";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";
import WarnIcon from "@/components/ui/WarnIcon";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };
const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase" as const, marginBottom:5 };

interface QuoteItem { description:string; quantity:number; unitPrice:number; total?:number }
interface Quote { id:string; quoteNumber:string; title:string; status:string; subtotal:number; discount:number; tax:number; total:number; validUntil:string|null; notes:string; createdAt:string; user:{ name:string; email:string }; items:QuoteItem[] }
interface User { id:string; name:string; email:string }

const STATUS_COLOR: Record<string, "green"|"yellow"|"red"|"gray"> = { ACCEPTED:"green", SENT:"yellow", DECLINED:"red", DRAFT:"gray", EXPIRED:"gray" };

type FormItem = { description:string; quantity:string; unitPrice:string };
const emptyItem = (): FormItem => ({ description:"", quantity:"1", unitPrice:"" });

export default function AdminQuotesPage() {
  const { t } = useLocale();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState("0");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const statusLabel = (s: string) => ({ DRAFT:t("Nháp"), SENT:t("Đã gửi"), ACCEPTED:t("Đã chấp nhận"), DECLINED:t("Đã từ chối"), EXPIRED:t("Hết hạn") } as Record<string,string>)[s] || s;

  async function load() {
    const r = await fetch("/api/admin/quotes");
    const d = await r.json();
    setQuotes(d.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/users?perPage=1000").then(r=>r.json()).then(d=>setUsers(d.data?.users || []));
  }, []);

  function resetForm() {
    setUserId(""); setTitle(""); setItems([emptyItem()]); setDiscount("0"); setValidUntil(""); setNotes(""); setError("");
  }

  function openForm() { resetForm(); setShowForm(true); }
  function closeForm() { setShowForm(false); }

  function addRow() { setItems(p=>[...p, emptyItem()]); }
  function removeRow(i: number) { setItems(p=>p.length>1 ? p.filter((_,idx)=>idx!==i) : p); }
  function updateRow(i: number, key: keyof FormItem, val: string) {
    setItems(p=>p.map((it,idx)=>idx===i?{...it,[key]:val}:it));
  }

  const previewTotal = items.reduce((s,it)=>s + (parseFloat(it.quantity)||0)*(parseFloat(it.unitPrice)||0), 0) - (parseFloat(discount)||0);

  async function submit(send: boolean) {
    setError("");
    if (!userId) { setError(t("Vui lòng chọn khách hàng")); return; }
    const cleanItems = items
      .map(it=>({ description:it.description.trim(), quantity:parseFloat(it.quantity)||0, unitPrice:parseFloat(it.unitPrice)||0 }))
      .filter(it=>it.description && it.quantity>0);
    if (cleanItems.length === 0) { setError(t("Cần ít nhất một hạng mục")); return; }
    setSaving(true);
    const res = await fetch("/api/admin/quotes", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ userId, title:title.trim(), items:cleanItems, discount:parseFloat(discount)||0, validUntil:validUntil||null, notes:notes.trim(), send }),
    });
    const data = await res.json().catch(()=>({}));
    if (res.ok && data.error == null) {
      setShowForm(false);
      resetForm();
      await load();
    } else {
      setError(data.error || t("Có lỗi xảy ra"));
    }
    setSaving(false);
  }

  async function sendQuote(id: string) {
    await fetch(`/api/admin/quotes/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:"SENT" }) });
    await load();
  }

  async function deleteQuote(id: string) {
    if (!confirm(t("Xoá báo giá?"))) return;
    await fetch(`/api/admin/quotes/${id}`, { method:"DELETE" });
    await load();
  }

  if (loading) return <div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Báo giá")}</h1>
        <button onClick={openForm} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> {t("Tạo báo giá")}
        </button>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Số báo giá"),t("Khách hàng"),t("Tổng tiền"),t("Trạng thái"),t("Hạn báo giá"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có báo giá nào")}</td></tr>
            )}
            {quotes.map(q=>(
              <tr key={q.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:13.5, fontWeight:700, color:"var(--accent)", background:"var(--accent-soft)", padding:"3px 8px", borderRadius:6 }}>{q.quoteNumber}</span>
                </td>
                <td style={{ padding:"12px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{q.user?.name || q.user?.email}</td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(q.total)}</td>
                <td style={{ padding:"12px 14px" }}><Badge color={STATUS_COLOR[q.status] || "gray"}>{statusLabel(q.status)}</Badge></td>
                <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{q.validUntil ? formatDate(q.validUntil) : "—"}</td>
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    {q.status === "DRAFT" && (
                      <button onClick={()=>sendQuote(q.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--accent)", fontSize:11.5, cursor:"pointer", fontWeight:600 }}>
                        {t("Gửi")}
                      </button>
                    )}
                    <button onClick={()=>deleteQuote(q.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:11.5, cursor:"pointer", fontWeight:600 }}>
                      {t("Xoá")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={closeForm}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:560, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{t("Tạo báo giá")}</h3>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t("Khách hàng")}</label>
              <select value={userId} onChange={e=>setUserId(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}>
                <option value="">{t("Chọn khách hàng")}</option>
                {users.map(u=>(
                  <option key={u.id} value={u.id}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t("Tiêu đề")}</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t("Hạng mục")}</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {items.map((it,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 70px 110px 28px", gap:8, alignItems:"center" }}>
                    <input value={it.description} onChange={e=>updateRow(i,"description",e.target.value)} placeholder={t("Mô tả")} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    <input type="number" value={it.quantity} onChange={e=>updateRow(i,"quantity",e.target.value)} placeholder={t("SL")} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    <input type="number" value={it.unitPrice} onChange={e=>updateRow(i,"unitPrice",e.target.value)} placeholder={t("Đơn giá")} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    <button type="button" onClick={()=>removeRow(i)} style={{ height:"100%", padding:0, background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-muted)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addRow} style={{ marginTop:8, padding:"6px 12px", background:"var(--bg-hover)", border:"1px dashed var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                + {t("Thêm dòng")}
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div>
                <label style={labelStyle}>{t("Giảm giá")}</label>
                <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0" style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div>
                <label style={labelStyle}>{t("Hạn báo giá")}</label>
                <input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} style={{ ...inputStyle, colorScheme:"dark" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t("Ghi chú")}</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"baseline", gap:8, marginBottom:16, fontSize:14 }}>
              <span style={{ color:"var(--text-muted)", fontWeight:600 }}>{t("Tổng:")}</span>
              <span style={{ color:"var(--text-primary)", fontWeight:800, fontSize:16 }}>{formatCurrency(previewTotal)}</span>
            </div>

            {error && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}><WarnIcon /> {error}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={closeForm} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{t("Huỷ")}</button>
              <button type="button" disabled={saving} onClick={()=>submit(false)} style={{ flex:1.5, padding:"10px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-primary)", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {t("Lưu nháp")}
              </button>
              <button type="button" disabled={saving} onClick={()=>submit(true)} style={{ flex:1.5, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                {t("Tạo & gửi")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
