"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

type Props = { serviceType: "vps" | "hosting"; orderId: string; currentPackageId: string; status: string };

export default function ServiceActions({ serviceType, orderId, currentPackageId, status }: Props) {
  const [packages, setPackages] = useState<any[]>([]);
  const [pending, setPending] = useState<any>(null);
  const [modal, setModal] = useState<null | "change" | "cancel">(null);
  const [target, setTarget] = useState("");
  const [cancelMode, setCancelMode] = useState("END_OF_TERM");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const loadPending = useCallback(() => {
    fetch("/api/services/request").then(r=>r.json()).then(d=>{
      const reqs: any[] = d.data || [];
      const key = serviceType === "vps" ? "vpsOrderId" : "hostingOrderId";
      setPending(reqs.find(r => r[key] === orderId && r.status === "PENDING") || null);
    }).catch(()=>{});
  }, [serviceType, orderId]);

  useEffect(() => {
    fetch(`/api/${serviceType}/packages`).then(r=>r.json()).then(d=>setPackages(d.data || d.data?.items || [])).catch(()=>{});
    loadPending();
  }, [serviceType, loadPending]);

  const current = packages.find(p => p.id === currentPackageId);
  const others = packages.filter(p => p.id !== currentPackageId);

  async function submit(payload: any) {
    setBusy(true);
    const res = await fetch("/api/services/request", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ serviceType, orderId, ...payload }) });
    const d = await res.json().catch(()=>({}));
    setBusy(false);
    if (res.ok) { setModal(null); setDone("Đã gửi yêu cầu, admin sẽ xử lý sớm."); loadPending(); }
    else alert(d.error || "Lỗi");
  }

  function submitChange() {
    if (!target) return;
    const t = packages.find(p => p.id === target);
    const type = current && t && Number(t.priceMonthly) >= Number(current.priceMonthly) ? "UPGRADE" : "DOWNGRADE";
    submit({ type, targetPackageId: target, note: reason });
  }

  if (status !== "ACTIVE") return null;

  return (
    <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px", marginTop:16 }}>
      <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>Quản lý dịch vụ</div>
      {done && <div style={{ fontSize:12.5, color:"var(--green)", marginBottom:12 }}>{done}</div>}
      {pending ? (
        <div style={{ fontSize:13, color:"var(--text-secondary)", background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:"12px 14px" }}>
          Đang có yêu cầu <b>{pending.type}</b> chờ admin duyệt.
        </div>
      ) : (
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setModal("change")} style={{ padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>Đổi gói</button>
          <button onClick={()=>setModal("cancel")} style={{ padding:"9px 16px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--red)", fontSize:13, fontWeight:600, cursor:"pointer" }}>Yêu cầu huỷ</button>
        </div>
      )}

      {modal === "change" && (
        <Modal onClose={()=>setModal(null)} title="Đổi gói dịch vụ">
          <p style={{ fontSize:12.5, color:"var(--text-muted)", marginBottom:14 }}>Phí chênh lệch được tính theo thời gian còn lại của chu kỳ và trừ/hoàn vào ví khi admin duyệt.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:260, overflowY:"auto", marginBottom:16 }}>
            {others.map(p=>(
              <label key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", border:`1.5px solid ${target===p.id?"var(--accent)":"var(--border)"}`, borderRadius:"var(--radius-md)", cursor:"pointer", background:target===p.id?"var(--accent-soft)":"transparent" }}>
                <span style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="radio" checked={target===p.id} onChange={()=>setTarget(p.id)}/>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{p.name}</span>
                </span>
                <span style={{ fontSize:12.5, color:"var(--text-secondary)" }}>{formatCurrency(Number(p.priceMonthly))}/th</span>
              </label>
            ))}
          </div>
          <button onClick={submitChange} disabled={busy||!target} style={{ width:"100%", padding:"11px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13.5, cursor:target?"pointer":"not-allowed", opacity:target?1:0.5 }}>{busy?"Đang gửi...":"Gửi yêu cầu đổi gói"}</button>
        </Modal>
      )}

      {modal === "cancel" && (
        <Modal onClose={()=>setModal(null)} title="Yêu cầu huỷ dịch vụ">
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {[
              { v:"END_OF_TERM", t:"Huỷ cuối kỳ", d:"Dịch vụ chạy đến hết hạn rồi ngừng, không hoàn tiền." },
              { v:"IMMEDIATE", t:"Huỷ ngay", d:"Ngừng ngay, hoàn phần thời gian còn lại vào ví." },
            ].map(o=>(
              <label key={o.v} style={{ display:"flex", gap:10, padding:"11px 13px", border:`1.5px solid ${cancelMode===o.v?"var(--accent)":"var(--border)"}`, borderRadius:"var(--radius-md)", cursor:"pointer", background:cancelMode===o.v?"var(--accent-soft)":"transparent" }}>
                <input type="radio" checked={cancelMode===o.v} onChange={()=>setCancelMode(o.v)} style={{ marginTop:3 }}/>
                <span>
                  <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", display:"block" }}>{o.t}</span>
                  <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{o.d}</span>
                </span>
              </label>
            ))}
          </div>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Lý do huỷ (tuỳ chọn)..." rows={3} style={{ width:"100%", boxSizing:"border-box", background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", resize:"vertical", marginBottom:16, fontFamily:"inherit" }}/>
          <button onClick={()=>submit({ type:"CANCEL", cancelMode, note:reason })} disabled={busy} style={{ width:"100%", padding:"11px", background:"var(--red)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13.5, cursor:"pointer" }}>{busy?"Đang gửi...":"Gửi yêu cầu huỷ"}</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={onClose}>
      <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:460, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
