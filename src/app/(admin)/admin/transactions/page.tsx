"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const typeColor: Record<string,"green"|"red"|"yellow"|"blue"> = { DEPOSIT:"green", PURCHASE:"yellow", REFUND:"blue", BONUS:"green", COMMISSION:"blue", WITHDRAWAL:"red", ADJUSTMENT:"gray" as any };
const typeLabel: Record<string,string> = { DEPOSIT:"Nạp tiền", PURCHASE:"Thanh toán", REFUND:"Hoàn tiền", BONUS:"Thưởng", COMMISSION:"Hoa hồng", WITHDRAWAL:"Rút", ADJUSTMENT:"Điều chỉnh" };

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/transactions?${filter?"type="+filter:""}`).then(r=>r.json()).then(d=>{ setTxs(d.data?.items||[]); setTotal(d.data?.total||0); setLoading(false); });
  }, [filter]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Giao dịch ({total})</h1>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ padding:"8px 12px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-primary)", fontSize:13, cursor:"pointer", outline:"none" }}>
          <option value="">Tất cả loại</option>
          {Object.entries(typeLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:300, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid var(--border)" }}>
                  {["Thời gian","Người dùng","Loại","Số tiền","Số dư sau","Mô tả"].map(h=>(
                    <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map(tx=>(
                  <tr key={tx.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                  >
                    <td style={{ padding:"11px 14px", fontSize:11.5, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(tx.createdAt)}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontSize:12.5, fontWeight:600, color:"var(--text-primary)" }}>{tx.user?.name||"—"}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{tx.user?.email}</div>
                    </td>
                    <td style={{ padding:"11px 14px" }}><Badge color={typeColor[tx.type]||"gray"}>{typeLabel[tx.type]||tx.type}</Badge></td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type)?"var(--green)":"var(--red)", whiteSpace:"nowrap" }}>
                      {["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type)?"+":"-"}{formatCurrency(Math.abs(Number(tx.amount)))}
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatCurrency(tx.balanceAfter)}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"var(--text-secondary)", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.description||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
