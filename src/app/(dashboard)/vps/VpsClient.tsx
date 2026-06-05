"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const statusColor: Record<string, "green"|"yellow"|"red"|"blue"|"gray"> = {
  ACTIVE: "green", PENDING: "yellow", SUSPENDED: "red", TERMINATED: "red", REBUILDING: "blue",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "Đang chạy", PENDING: "Đang tạo", SUSPENDED: "Tạm dừng", TERMINATED: "Đã xoá", REBUILDING: "Đang rebuild",
};

export default function VpsClient({ orders }: { orders: any[] }) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [showConfirm, setShowConfirm] = useState<{ id: string; action: string } | null>(null);

  async function doAction(vpsId: string, action: string) {
    setActionLoading(p => ({ ...p, [vpsId + action]: true }));
    try {
      const res = await fetch(`/api/vps/${vpsId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setActionLoading(p => ({ ...p, [vpsId + action]: false }));
      setShowConfirm(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 2 }}>Máy chủ VPS</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{orders.length} VPS trong tài khoản</p>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
          background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)",
          color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Icon d="M12 5v14 M5 12h14" /> Mua VPS mới
        </button>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4"/></svg></div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Chưa có VPS nào</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>Mua VPS đầu tiên để bắt đầu</p>
          <button style={{ padding: "10px 24px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, cursor: "pointer" }}>
            Mua VPS ngay
          </button>
        </div>
      )}

      {/* VPS Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map(vps => (
          <div key={vps.id} className="animate-in" style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "20px",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              {/* Icon + Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 280px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-md)",
                  background: vps.status === "ACTIVE" ? "var(--green-soft)" : "var(--bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: vps.status === "ACTIVE" ? "var(--green)" : "var(--text-muted)",
                  flexShrink: 0,
                }}>
                  <Icon d="M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7 M2 19h20 M5 19v-4 M19 19v-4" size={18} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>{vps.hostname}</span>
                    <Badge color={statusColor[vps.status] || "gray"}>{statusLabel[vps.status] || vps.status}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {vps.ipAddress || "Đang cấp phát IP..."}
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div style={{ display: "flex", gap: 20, flex: "1 1 200px" }}>
                {[
                  { label: "CPU", val: `${vps.package?.cpu || "-"} vCPU` },
                  { label: "RAM", val: `${vps.package?.ram || "-"} GB` },
                  { label: "Disk", val: `${vps.package?.storage || "-"} GB` },
                  { label: "OS", val: vps.os || "-" },
                ].map(spec => (
                  <div key={spec.label}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{spec.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{spec.val}</div>
                  </div>
                ))}
              </div>

              {/* Price + Expiry */}
              <div style={{ flex: "0 0 auto", textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{formatCurrency(vps.price)}/tháng</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>
                  HH: {vps.expiresAt ? formatDate(vps.expiresAt) : "—"}
                </div>
                <Link href={`/vps/${vps.id}`} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Quản lý →</Link>
              </div>
            </div>

            {/* Actions */}
            {vps.status === "ACTIVE" && (
              <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                {[
                  { action: "power_off", label: "Tắt", icon: "M18.36 6.64a9 9 0 11-12.73 0 M12 2v10", color: "var(--red)" },
                  { action: "restart", label: "Khởi động lại", icon: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15", color: "var(--yellow)" },
                  { action: "rebuild", label: "Cài lại OS", icon: "M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m4 4V7", color: "var(--purple)" },
                ].map(btn => (
                  <button key={btn.action} onClick={() => setShowConfirm({ id: vps.id, action: btn.action })}
                    disabled={actionLoading[vps.id + btn.action]}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                      background: "var(--bg-elevated)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)", color: "var(--text-secondary)",
                      fontSize: 12.5, cursor: "pointer", transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = btn.color; (e.currentTarget as HTMLElement).style.color = btn.color; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                  >
                    <span style={{ color: "inherit" }}><Icon d={btn.icon} size={13} /></span>
                    {actionLoading[vps.id + btn.action] ? "..." : btn.label}
                  </button>
                ))}
                <button style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", color: "var(--text-secondary)",
                  fontSize: 12.5, cursor: "pointer", marginLeft: "auto",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                >
                  <Icon d="M9 12h6 M12 9v6 M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z M15 3v6h6" size={13} />
                  Nhật ký
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }} onClick={() => setShowConfirm(null)}>
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "24px", width: 360, maxWidth: "90vw",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Xác nhận thao tác
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Bạn chắc chắn muốn thực hiện <strong style={{ color: "var(--text-primary)" }}>{showConfirm.action.replace("_", " ")}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirm(null)} style={{ flex: 1, padding: "9px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>
                Huỷ
              </button>
              <button onClick={() => doAction(showConfirm.id, showConfirm.action)} style={{ flex: 1, padding: "9px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
