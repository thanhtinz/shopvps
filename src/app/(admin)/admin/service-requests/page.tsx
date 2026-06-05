"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const STATUS = [
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "COMPLETED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "", label: "Tất cả" },
];
const typeLabel: Record<string, string> = { CANCEL: "Huỷ dịch vụ", UPGRADE: "Nâng gói", DOWNGRADE: "Hạ gói", ADDON: "Add-on" };
const typeColor: Record<string, "red"|"green"|"yellow"|"blue"> = { CANCEL: "red", UPGRADE: "green", DOWNGRADE: "yellow", ADDON: "blue" };
const statusColor: Record<string, "yellow"|"green"|"red"|"gray"> = { PENDING: "yellow", COMPLETED: "green", REJECTED: "red" };

export default function AdminServiceRequestsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [amts, setAmts] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/service-requests?status=${status}`).then(r=>r.json()).then(d=>{ setItems(d.data?.items||[]); setLoading(false); });
  }, [status]);
  useEffect(() => { load(); }, [load]);

  async function act(r: any, action: "approve"|"reject") {
    setBusy(r.id + action);
    const body: any = { id: r.id, action };
    if (action === "approve" && amts[r.id] !== undefined && amts[r.id] !== "") body.amount = parseInt(amts[r.id]);
    if (action === "reject") body.adminNote = prompt(t("Lý do từ chối (tuỳ chọn):")) || undefined;
    const res = await fetch("/api/admin/service-requests", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); alert(d.error || t("Lỗi")); }
    setBusy(null); load();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Yêu cầu dịch vụ")}</h1>
        <div style={{ display:"flex", gap:4, background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:4 }}>
          {STATUS.map(s=>(
            <button key={s.key} onClick={()=>setStatus(s.key)} style={{ padding:"7px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", fontSize:12.5, fontWeight:600, background:status===s.key?"var(--bg-surface)":"transparent", color:status===s.key?"var(--text-primary)":"var(--text-muted)" }}>{t(s.label)}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:240, margin:16, borderRadius:"var(--radius-md)" }}/> : items.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>{t("Không có yêu cầu nào")}</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Khách"),t("Loại"),t("Dịch vụ"),t("Chi tiết"),t("Tiền"),t("Trạng thái"),t("Thao tác")].map(h=>(
                <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map(r=>{
                const label = r.serviceType==="vps" ? (r.order?.hostname||"VPS") : (r.order?.domain||"Hosting");
                const amt = Number(r.amount);
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{r.user?.name||"—"}</div>
                      <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{t("Số dư:")} {formatCurrency(r.user?.balance||0)}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}><Badge color={typeColor[r.type]||"gray"}>{t(typeLabel[r.type]||r.type)}</Badge></td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, color:"var(--text-primary)" }}>{label}</div>
                      <div style={{ fontSize:11.5, color:"var(--text-muted)", textTransform:"uppercase" }}>{r.serviceType} · {r.order?.package?.name||""}</div>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-secondary)", maxWidth:220 }}>
                      {r.type==="CANCEL" && <div>{r.cancelMode==="IMMEDIATE"?t("Huỷ ngay (hoàn tiền)"):t("Huỷ cuối kỳ")}</div>}
                      {(r.type==="UPGRADE"||r.type==="DOWNGRADE") && <div>→ {r.targetName||"?"}</div>}
                      {r.note && <div style={{ color:"var(--text-muted)", fontStyle:"italic", marginTop:2 }}>{r.note}</div>}
                      {r.adminNote && <div style={{ color:"var(--red)", marginTop:2 }}>Admin: {r.adminNote}</div>}
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color: amt>0?"var(--red)":amt<0?"var(--green)":"var(--text-muted)" }}>
                      {amt>0?`${t("Thu")} ${formatCurrency(amt)}`:amt<0?`${t("Hoàn")} ${formatCurrency(-amt)}`:"—"}
                    </td>
                    <td style={{ padding:"12px 16px" }}><Badge color={statusColor[r.status]||"gray"}>{r.status}</Badge></td>
                    <td style={{ padding:"12px 16px" }}>
                      {r.status==="PENDING" ? (
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          {r.type==="ADDON" && (
                            <input value={amts[r.id]??""} onChange={e=>setAmts(p=>({...p,[r.id]:e.target.value}))} placeholder={t("Phí")} style={{ width:70, background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"5px 8px", color:"var(--text-primary)", fontSize:12, outline:"none" }}/>
                          )}
                          <button onClick={()=>act(r,"approve")} disabled={!!busy} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"none", background:"var(--green)", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t("Duyệt")}</button>
                          <button onClick={()=>act(r,"reject")} disabled={!!busy} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t("Từ chối")}</button>
                        </div>
                      ) : <span style={{ fontSize:12, color:"var(--text-muted)" }}>{formatDate(r.processedAt)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
