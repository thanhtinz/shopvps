"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminGiftCodesPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => fetch("/api/admin/gift-codes").then(r=>r.json()).then(d=>{ setItems(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setCreating(true);
    await fetch("/api/admin/gift-codes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ amount, quantity, expiresAt: expiresAt||undefined }) });
    setCreating(false); setAmount(""); setQuantity("1"); setExpiresAt(""); load();
  }
  async function patch(id: string, isActive: boolean) { await fetch(`/api/admin/gift-codes/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ isActive }) }); load(); }
  async function remove(id: string) { if (!confirm(t("Xoá mã?"))) return; await fetch(`/api/admin/gift-codes/${id}`, { method:"DELETE" }); load(); }

  const inp = { background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 11px", color:"var(--text-primary)", fontSize:13, outline:"none" };

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>{t("Mã quà tặng / Credit")}</h1>

      <form onSubmit={create} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px", marginBottom:20, display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
        <div><label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:5 }}>{t("Mệnh giá")}</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="100000" style={{ ...inp, width:140 }}/></div>
        <div><label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:5 }}>{t("Số lượng")}</label><input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{ ...inp, width:90 }}/></div>
        <div><label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:5 }}>{t("Hết hạn (tuỳ chọn)")}</label><input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} style={inp}/></div>
        <button type="submit" disabled={creating} style={{ padding:"10px 18px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>{creating?t("Đang tạo..."):t("Tạo mã")}</button>
      </form>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:160, margin:16, borderRadius:"var(--radius-md)" }}/> : items.length===0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có mã nào")}</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Mã"),t("Mệnh giá"),t("Trạng thái"),t("Đã dùng"),t("Hết hạn"),""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(g=>(
                <tr key={g.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)", fontFamily:"var(--font-mono)" }}>{g.code}</td>
                  <td style={{ padding:"11px 14px", fontSize:13, color:"var(--text-secondary)" }}>{formatCurrency(Number(g.amount))}</td>
                  <td style={{ padding:"11px 14px" }}>
                    {g.redeemedBy ? <Badge color="gray">{t("Đã đổi")}</Badge> : (
                      <button onClick={()=>patch(g.id, !g.isActive)} style={{ border:"none", background:"transparent", cursor:"pointer" }}><Badge color={g.isActive?"green":"gray"}>{g.isActive?t("Còn hiệu lực"):t("Tắt")}</Badge></button>
                    )}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-muted)" }}>{g.redeemedAt?formatDate(g.redeemedAt):"—"}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-muted)" }}>{g.expiresAt?formatDate(g.expiresAt):"—"}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <button onClick={()=>remove(g.id)} style={{ padding:"5px 10px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>{t("Xoá")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
