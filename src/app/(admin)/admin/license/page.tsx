"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const statusColor: Record<string, "green"|"yellow"|"red"|"gray"> = { VALID: "green", GRACE: "yellow", INVALID: "red", EXPIRED: "red", NOT_SETUP: "gray" };
const statusLabel: Record<string, string> = { VALID: "Hợp lệ", GRACE: "Gia hạn tạm (server lỗi)", INVALID: "Không hợp lệ", EXPIRED: "Hết hạn", NOT_SETUP: "Chưa cài đặt" };

export default function AdminLicensePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/admin/license").then(r=>r.json()).then(d=>{ setData(d.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function verifyNow() {
    setVerifying(true); setMsg("");
    const res = await fetch("/api/admin/license", { method:"POST" });
    const d = await res.json();
    setVerifying(false);
    setMsg(res.ok ? `Đã kiểm tra: ${statusLabel[d.data?.status] || d.data?.status}${d.data?.grace ? " (grace)" : ""}` : (d.error || "Lỗi"));
    load();
  }

  if (loading) return <div className="skeleton" style={{ height:320, borderRadius:"var(--radius-lg)" }}/>;

  const rows = [
    { label: "Domain", value: data?.domain || "—" },
    { label: "Sản phẩm", value: data?.productId || "—" },
    { label: "Phiên bản", value: data?.version || "—" },
    { label: "License key", value: data?.licenseKey || "—" },
    { label: "Runtime key", value: data?.runtimeKey || "—" },
    { label: "Hardware fingerprint", value: data?.hwFingerprint || "—" },
    { label: "Hết hạn", value: data?.expiresAt ? formatDate(data.expiresAt) : "Không giới hạn" },
    { label: "Verify gần nhất", value: data?.lastVerifiedAt ? formatDate(data.lastVerifiedAt) : "—" },
    { label: "Cài đặt lúc", value: data?.setupAt ? formatDate(data.setupAt) : "—" },
    { label: "Cài đặt bởi", value: data?.setupBy || "—" },
  ];

  return (
    <div style={{ maxWidth:760 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>Giấy phép (License)</h1>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px 22px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Trạng thái</span>
            <Badge color={statusColor[data?.status] || "gray"}>{statusLabel[data?.status] || data?.status}</Badge>
          </div>
          <button onClick={verifyNow} disabled={verifying} style={{ padding:"8px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>{verifying ? "Đang kiểm tra..." : "Verify lại ngay"}</button>
        </div>
        {msg && <div style={{ fontSize:12.5, color:"var(--text-secondary)", marginBottom:14, padding:"9px 12px", background:"var(--bg-elevated)", borderRadius:"var(--radius-md)" }}>{msg}</div>}

        {data?.status === "NOT_SETUP" ? (
          <div style={{ fontSize:13, color:"var(--text-muted)" }}>Chưa nhập license key. Vào trang <code>/setup</code> để kích hoạt.</div>
        ) : (
          <div>
            {rows.map(r=>(
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", gap:14, padding:"9px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                <span style={{ color:"var(--text-muted)" }}>{r.label}</span>
                <span style={{ color:"var(--text-primary)", fontWeight:600, fontFamily:"var(--font-mono)", textAlign:"right", wordBreak:"break-all" }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
        Hệ thống tự verify với license server mỗi giờ và có grace period 24h khi server không phản hồi.
        Cấu hình endpoint qua biến môi trường <code>LS_ENDPOINT</code>; định dạng timestamp qua <code>LS_TIMESTAMP_FORMAT</code> (ms/sec/iso).
      </p>
    </div>
  );
}
