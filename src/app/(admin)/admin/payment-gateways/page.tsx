"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const HINTS: Record<string, string> = {
  manual: "Không cần cấu hình — dùng tài khoản ngân hàng ở mục Cài đặt. Admin duyệt thủ công.",
  sepay: "Không cần cấu hình ở đây — dùng SEPAY_WEBHOOK_SECRET (env) + tài khoản ngân hàng. Cộng tiền tự động.",
  stripe: '{"secretKey":"sk_live_...","webhookSecret":"whsec_..."}  · Webhook: /api/webhook/stripe',
  paypal: '{"clientId":"...","secret":"...","mode":"sandbox"}  · Trả về: /api/payments/paypal/capture',
};

export default function AdminGatewaysPage() {
  const [items, setItems] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = () => Promise.all([
    fetch("/api/admin/payment-gateways").then(r=>r.json()),
    fetch("/api/admin/deposits").then(r=>r.json()),
  ]).then(([g, d]) => { setItems(g.data||[]); setDeposits(d.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function patch(id: string, data: any) {
    const res = await fetch(`/api/admin/payment-gateways/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); alert(d.error || "Lỗi"); return; }
    load();
  }
  async function deposit(reference: string, action: "approve"|"reject") {
    await fetch("/api/admin/deposits", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ reference, action }) });
    load();
  }

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>Cổng thanh toán</h1>

      <div style={{ display:"grid", gap:14, marginBottom:28 }}>
        {items.map(g=>(
          <div key={g.id} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:14.5, fontWeight:700, color:"var(--text-primary)" }}>{g.name}</span>
                <Badge color={g.isActive?"green":"gray"}>{g.isActive?"Đang bật":"Tắt"}</Badge>
                <code style={{ fontSize:11, color:"var(--text-muted)" }}>{g.code}</code>
              </div>
              <button onClick={()=>patch(g.id,{ isActive: !g.isActive })} style={{ padding:"7px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:g.isActive?"var(--red)":"var(--green)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>{g.isActive?"Tắt":"Bật"}</button>
            </div>
            <p style={{ fontSize:11.5, color:"var(--text-muted)", marginBottom:10 }}>{HINTS[g.code]}</p>
            {(g.code==="stripe"||g.code==="paypal") && (
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <textarea
                  defaultValue={g.config}
                  onChange={e=>setDrafts(p=>({...p,[g.id]:e.target.value}))}
                  rows={2}
                  style={{ flex:1, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 11px", color:"var(--text-primary)", fontSize:12, fontFamily:"monospace", outline:"none", resize:"vertical" }}
                />
                <button onClick={()=>patch(g.id,{ config: drafts[g.id] ?? g.config })} style={{ padding:"9px 14px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Lưu</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>Giao dịch nạp chờ duyệt ({deposits.length})</h2>
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {deposits.length===0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-muted)", fontSize:13 }}>Không có giao dịch chờ duyệt</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Khách","Cổng","Số tiền","Mã tham chiếu","Thời gian","Thao tác"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {deposits.map(t=>(
                <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{t.user?.name||"—"}</div>
                    <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{t.user?.email}</div>
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{t.gateway||"—"}{t.currency&&t.currency!=="VND"?` · ${Number(t.currencyAmount)} ${t.currency}`:""}</td>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(Number(t.amount))}</td>
                  <td style={{ padding:"11px 14px", fontSize:11.5, color:"var(--text-muted)", fontFamily:"monospace" }}>{t.reference}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-muted)" }}>{formatDate(t.createdAt)}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>deposit(t.reference,"approve")} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"none", background:"var(--green)", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>Duyệt</button>
                      <button onClick={()=>deposit(t.reference,"reject")} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>Từ chối</button>
                    </div>
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
