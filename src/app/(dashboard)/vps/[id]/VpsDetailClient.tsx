"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import ServiceActions from "@/components/ServiceActions";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>;
}

const statusColor: Record<string, "green"|"yellow"|"red"|"blue"|"gray"> = { ACTIVE: "green", PENDING: "yellow", SUSPENDED: "red", TERMINATED: "red", REBUILDING: "blue" };
const statusLabel: Record<string, string> = { ACTIVE: "Đang chạy", PENDING: "Đang tạo", SUSPENDED: "Tạm dừng", TERMINATED: "Đã xoá", REBUILDING: "Đang rebuild" };

const card: React.CSSProperties = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 };
const btn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" };

export default function VpsDetailClient({ vps }: { vps: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [cred, setCred] = useState<{ password: string | null; ip: string | null } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [confirm, setConfirm] = useState<{ action: string; needsOs?: boolean; needsPw?: boolean } | null>(null);
  const [field, setField] = useState("");

  useEffect(() => {
    fetch(`/api/vps/${vps.id}/logs`).then(r => r.json()).then(d => setLogs(d.data?.logs || [])).catch(() => {});
  }, [vps.id]);

  async function revealPassword() {
    if (cred) { setShowPw(s => !s); return; }
    const res = await fetch(`/api/vps/${vps.id}/password`);
    const d = await res.json();
    if (res.ok) { setCred(d.data); setShowPw(true); }
  }

  async function doAction(action: string, extra: any = {}) {
    setBusy(action); setMsg(null);
    try {
      const res = await fetch(`/api/vps/${vps.id}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (res.ok) { setMsg({ type: "ok", text: "Thao tác thành công" }); setTimeout(() => window.location.reload(), 900); }
      else setMsg({ type: "err", text: d.error || "Thất bại" });
    } catch { setMsg({ type: "err", text: "Không thể kết nối" }); }
    finally { setBusy(null); setConfirm(null); setField(""); }
  }

  const isActive = vps.status === "ACTIVE";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/vps" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        <Icon d="M19 12H5 M12 19l-7-7 7-7" size={14} /> Quay lại danh sách VPS
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{vps.hostname}</h1>
        <Badge color={statusColor[vps.status] || "gray"}>{statusLabel[vps.status] || vps.status}</Badge>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{vps.ipAddress || "Đang cấp phát IP..."}</span>
      </div>

      {msg && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, background: msg.type === "ok" ? "var(--green-soft)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--green)" : "var(--red)" }}>{msg.text}</div>}

      {/* Specs */}
      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Thông số</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          {[
            { label: "Gói", val: vps.package?.name || "-" },
            { label: "CPU", val: `${vps.package?.cpu || "-"} vCPU` },
            { label: "RAM", val: `${vps.package?.ram || "-"} GB` },
            { label: "Disk", val: `${vps.package?.storage || "-"} GB` },
            { label: "OS", val: vps.os || "-" },
            { label: "Provider", val: vps.provider?.name || "-" },
            { label: "Giá", val: `${formatCurrency(vps.price)}/th` },
            { label: "Hết hạn", val: vps.expiresAt ? formatDate(vps.expiresAt) : "—" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials */}
      {isActive && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Thông tin truy cập</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)" }}>root@</span>{vps.ipAddress}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "6px 12px", borderRadius: "var(--radius-md)", minWidth: 140 }}>
              {showPw && cred?.password ? cred.password : "••••••••••"}
            </div>
            <button onClick={revealPassword} style={btn}>{showPw ? "Ẩn" : "Hiện mật khẩu"}</button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Điều khiển</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btn} disabled={!!busy} onClick={() => doAction("power_on")}><Icon d="M18.36 6.64a9 9 0 11-12.73 0 M12 2v10" size={14} /> Bật</button>
            <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "power_off" })}><Icon d="M18.36 6.64a9 9 0 11-12.73 0 M12 2v10" size={14} /> Tắt</button>
            <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "restart" })}><Icon d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15" size={14} /> Khởi động lại</button>
            <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "rebuild", needsOs: true })}><Icon d="M21 2H3v16h5v4l4-4h5l4-4V2z" size={14} /> Cài lại OS</button>
            <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "change_password", needsPw: true })}><Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" size={14} /> Đổi mật khẩu</button>
          </div>
        </div>
      )}

      {/* Logs */}
      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Nhật ký hoạt động</h3>
        {logs.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Chưa có nhật ký.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: log.status === "success" ? "var(--green)" : "var(--red)" }}>●</span> {log.action}{log.message ? ` — ${log.message}` : ""}
                </span>
                <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ServiceActions serviceType="vps" orderId={vps.id} currentPackageId={vps.packageId} status={vps.status} />

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setConfirm(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, width: 380, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Xác nhận: {confirm.action.replace("_", " ")}</h3>
            {confirm.needsOs && (
              <input value={field} onChange={e => setField(e.target.value)} placeholder="OS ID (vd: ubuntu-22-04)" style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }} />
            )}
            {confirm.needsPw && (
              <input type="password" value={field} onChange={e => setField(e.target.value)} placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }} />
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>Huỷ</button>
              <button
                onClick={() => doAction(confirm.action, confirm.needsOs ? { osId: field } : confirm.needsPw ? { password: field } : {})}
                disabled={(confirm.needsOs && !field) || (confirm.needsPw && field.length < 8)}
                style={{ flex: 1, padding: 9, background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
