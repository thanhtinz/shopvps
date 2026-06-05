"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS = [
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "ACTIVE", label: "Hoạt động" },
  { key: "", label: "Tất cả" },
];
const statusColor: Record<string, "green"|"yellow"|"red"|"gray"|"blue"> = { ACTIVE: "green", PENDING: "yellow", EXPIRED: "red", CANCELLED: "gray", TRANSFERRED: "blue" };

export default function AdminDomainsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/domains?status=${status}`).then(r=>r.json()).then(d=>{ setItems(d.data?.items||[]); setLoading(false); });
  }, [status]);
  useEffect(() => { load(); }, [load]);

  async function setStatusFor(id: string, s: string) {
    await fetch(`/api/admin/domains/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status: s }) });
    load();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Tên miền</h1>
        <div style={{ display:"flex", gap:4, background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:4 }}>
          {STATUS.map(s=>(
            <button key={s.key} onClick={()=>setStatus(s.key)} style={{ padding:"7px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", fontSize:12.5, fontWeight:600, background:status===s.key?"var(--bg-surface)":"transparent", color:status===s.key?"var(--text-primary)":"var(--text-muted)" }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:200, margin:16, borderRadius:"var(--radius-md)" }}/> : items.length===0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)", fontSize:13 }}>Không có tên miền nào</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Tên miền","Khách","Loại","Giá","Hết hạn","Trạng thái","Thao tác"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(d=>(
                <tr key={d.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"11px 14px", fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>{d.domain}
                    {d.nameservers && <div style={{ fontSize:11, color:"var(--text-muted)", fontWeight:400 }}>NS: {d.nameservers}</div>}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{d.user?.email}</td>
                  <td style={{ padding:"11px 14px", fontSize:12.5, color:"var(--text-secondary)" }}>{d.type==="transfer"?"Transfer":"Đăng ký"} · {d.years}n</td>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{formatCurrency(Number(d.price))}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-muted)" }}>{d.expiresAt?formatDate(d.expiresAt):"—"}</td>
                  <td style={{ padding:"11px 14px" }}><Badge color={statusColor[d.status]||"gray"}>{d.status}</Badge></td>
                  <td style={{ padding:"11px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      {d.status!=="ACTIVE" && <button onClick={()=>setStatusFor(d.id,"ACTIVE")} style={{ padding:"5px 11px", borderRadius:"var(--radius-sm)", border:"none", background:"var(--green)", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>Kích hoạt</button>}
                      {d.status!=="CANCELLED" && <button onClick={()=>setStatusFor(d.id,"CANCELLED")} style={{ padding:"5px 11px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, cursor:"pointer" }}>Huỷ</button>}
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
