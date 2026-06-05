"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [type, setType] = useState<"vps"|"hosting">("vps");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/orders?type=${type}`).then(r=>r.json()).then(d=>{ setOrders(d.data?.items||[]); setTotal(d.data?.total||0); setLoading(false); });
  }, [type]);

  const statusColor: Record<string,"green"|"yellow"|"red"|"blue"> = { ACTIVE:"green", PENDING:"yellow", SUSPENDED:"red", TERMINATED:"red", REBUILDING:"blue" };
  const statusLabel: Record<string,string> = { ACTIVE:"Đang chạy", PENDING:"Đang tạo", SUSPENDED:"Tạm dừng", TERMINATED:"Đã xoá", REBUILDING:"Rebuild" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Đơn hàng ({total})</h1>
        <div style={{ display:"flex", gap:4, background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:4 }}>
          {(["vps","hosting"] as const).map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{ padding:"7px 16px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:type===t?"var(--bg-surface)":"transparent", color:type===t?"var(--text-primary)":"var(--text-muted)" }}>
              {t === "vps" ? " VPS" : " Hosting"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:300, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Khách hàng","Dịch vụ","Giá","Trạng thái","Ngày tạo"].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{o.user?.name||"—"}</div>
                    <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{o.user?.email}</div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{type==="vps"?o.hostname:o.domain}</div>
                    <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{o.package?.name}</div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{formatCurrency(o.price)}</td>
                  <td style={{ padding:"12px 16px" }}><Badge color={statusColor[o.status]||"gray"}>{statusLabel[o.status]||o.status}</Badge></td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
