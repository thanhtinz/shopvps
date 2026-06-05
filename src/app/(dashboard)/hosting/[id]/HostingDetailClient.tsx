"use client";
import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>;
}

const statusColor: Record<string, "green"|"yellow"|"red"|"blue"|"gray"> = { ACTIVE: "green", PENDING: "yellow", SUSPENDED: "red", TERMINATED: "red" };
const statusLabel: Record<string, string> = { ACTIVE: "Đang hoạt động", PENDING: "Đang tạo", SUSPENDED: "Tạm dừng", TERMINATED: "Đã xoá" };

const card: React.CSSProperties = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 };
const btn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" };

export default function HostingDetailClient({ hosting }: { hosting: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; needsPw?: boolean; danger?: boolean } | null>(null);
  const [field, setField] = useState("");

  async function openCpanel() {
    setBusy("sso"); setMsg(null);
    try {
      const res = await fetch(`/api/hosting/${hosting.id}/cpanel-sso`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d.data?.url) window.open(d.data.url, "_blank");
      else setMsg({ type: "err", text: d.error || "Không thể mở cPanel" });
    } catch { setMsg({ type: "err", text: "Không thể kết nối" }); }
    finally { setBusy(null); }
  }

  async function doAction(action: string, extra: any = {}) {
    setBusy(action); setMsg(null);
    try {
      const res = await fetch(`/api/hosting/${hosting.id}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (res.ok) { setMsg({ type: "ok", text: "Thao tác thành công" }); setTimeout(() => window.location.reload(), 900); }
      else setMsg({ type: "err", text: d.error || "Thất bại" });
    } catch { setMsg({ type: "err", text: "Không thể kết nối" }); }
    finally { setBusy(null); setConfirm(null); setField(""); }
  }

  const isActive = hosting.status === "ACTIVE";
  const isSuspended = hosting.status === "SUSPENDED";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/hosting" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        <Icon d="M19 12H5 M12 19l-7-7 7-7" size={14} /> Quay lại danh sách Hosting
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{hosting.domain}</h1>
        <Badge color={statusColor[hosting.status] || "gray"}>{statusLabel[hosting.status] || hosting.status}</Badge>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>cPanel: {hosting.cpanelUsername || "Đang cấp"}</span>
      </div>

      {msg && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, background: msg.type === "ok" ? "var(--green-soft)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--green)" : "var(--red)" }}>{msg.text}</div>}

      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Thông số gói</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          {[
            { label: "Gói", val: hosting.package?.name || "-" },
            { label: "Disk", val: `${hosting.package?.storage || "-"} MB` },
            { label: "Băng thông", val: hosting.package?.bandwidth === 0 ? "Unlimited" : `${hosting.package?.bandwidth || "-"} MB` },
            { label: "Database", val: hosting.package?.databases === 0 ? "∞" : String(hosting.package?.databases ?? "-") },
            { label: "Email", val: hosting.package?.emailAccounts === 0 ? "∞" : String(hosting.package?.emailAccounts ?? "-") },
            { label: "Server", val: hosting.server?.name || "-" },
            { label: "Giá", val: `${formatCurrency(hosting.price)}/th` },
            { label: "Hết hạn", val: hosting.expiresAt ? formatDate(hosting.expiresAt) : "—" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {(isActive || isSuspended) && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Quản lý</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isActive && <button style={{ ...btn, background: "var(--accent)", color: "white", border: "none" }} disabled={!!busy} onClick={openCpanel}><Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" size={14} /> {busy === "sso" ? "Đang mở..." : "Đăng nhập cPanel"}</button>}
            {isActive && <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "change_password", needsPw: true })}><Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" size={14} /> Đổi mật khẩu</button>}
            {isActive && <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "suspend" })}><Icon d="M10 9v6 M14 9v6 M12 22a10 10 0 100-20 10 10 0 000 20" size={14} /> Tạm dừng</button>}
            {isSuspended && <button style={btn} disabled={!!busy} onClick={() => doAction("unsuspend")}><Icon d="M5 3l14 9-14 9V3z" size={14} /> Kích hoạt lại</button>}
            <button style={{ ...btn, color: "var(--red)" }} disabled={!!busy} onClick={() => setConfirm({ action: "terminate", danger: true })}><Icon d="M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={14} /> Huỷ hosting</button>
          </div>
        </div>
      )}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setConfirm(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, width: 380, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: confirm.danger ? "var(--red)" : "var(--text-primary)", marginBottom: 12 }}>
              {confirm.action === "terminate" ? "Huỷ hosting?" : confirm.action === "suspend" ? "Tạm dừng hosting?" : "Đổi mật khẩu cPanel"}
            </h3>
            {confirm.danger && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>Hành động này sẽ xoá tài khoản cPanel và không thể hoàn tác.</p>}
            {confirm.needsPw && (
              <input type="password" value={field} onChange={e => setField(e.target.value)} placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }} />
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>Huỷ</button>
              <button
                onClick={() => doAction(confirm.action, confirm.needsPw ? { password: field } : {})}
                disabled={confirm.needsPw && field.length < 8}
                style={{ flex: 1, padding: 9, background: confirm.danger ? "var(--red)" : "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
