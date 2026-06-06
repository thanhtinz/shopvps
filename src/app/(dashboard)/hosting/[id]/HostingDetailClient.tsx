"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import ServiceActions from "@/components/ServiceActions";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>;
}

const statusColor: Record<string, "green"|"yellow"|"red"|"blue"|"gray"> = { ACTIVE: "green", PENDING: "yellow", SUSPENDED: "red", TERMINATED: "red" };
const statusLabel: Record<string, string> = { ACTIVE: "Đang hoạt động", PENDING: "Đang tạo", SUSPENDED: "Tạm dừng", TERMINATED: "Đã xoá" };

const card: React.CSSProperties = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 };
const btn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" };

export default function HostingDetailClient({ hosting }: { hosting: any }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; needsPw?: boolean; danger?: boolean } | null>(null);
  const [field, setField] = useState("");
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState("");
  const [changing, setChanging] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ type: string } | null>(null);
  const [pendingCancel, setPendingCancel] = useState<{ cancelMode: string } | null>(null);
  const [cancelMode, setCancelMode] = useState<"END_OF_TERM" | "IMMEDIATE">("END_OF_TERM");
  const [cancelNote, setCancelNote] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/services/request`).then(r => r.json()).then(d => {
      const mine = (d.data || []).filter((r: any) => r.status === "PENDING" && r.hostingOrderId === hosting.id);
      const cancel = mine.find((r: any) => r.type === "CANCEL");
      if (cancel) setPendingCancel({ cancelMode: cancel.cancelMode });
      const change = mine.find((r: any) => r.type === "UPGRADE" || r.type === "DOWNGRADE");
      if (change) setPendingChange({ type: change.type });
    }).catch(() => {});
  }, [hosting.id]);

  async function submitCancel() {
    setCancelling(true); setMsg(null);
    try {
      const res = await fetch(`/api/services/request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType: "hosting", orderId: hosting.id, type: "CANCEL", cancelMode, note: cancelNote }),
      });
      const d = await res.json();
      if (res.ok) { setMsg({ type: "ok", text: t("Đã gửi yêu cầu huỷ") }); setPendingCancel({ cancelMode }); }
      else setMsg({ type: "err", text: d.error || t("Thất bại") });
    } catch { setMsg({ type: "err", text: t("Không thể kết nối") }); }
    finally { setCancelling(false); }
  }

  useEffect(() => {
    fetch(`/api/hosting/packages`).then(r => r.json()).then(d => {
      const list = (d.data || []).filter((p: any) => p.server?.id === hosting.serverId && p.id !== hosting.packageId);
      setPackages(list);
    }).catch(() => {});
  }, [hosting.serverId, hosting.packageId]);

  const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
  function estimateDiff(newMonthly: number) {
    const months = CYCLE_MONTHS[hosting.billingCycle] || 1;
    const termDays = months * 30;
    let remaining = hosting.expiresAt ? (new Date(hosting.expiresAt).getTime() - Date.now()) / 86400000 : 0;
    remaining = Math.max(0, Math.min(remaining, termDays));
    const fraction = termDays > 0 ? remaining / termDays : 0;
    return Math.round((newMonthly - hosting.price) * months * fraction);
  }

  async function changePackage() {
    if (!selectedPkg) return;
    const pkg = packages.find(p => p.id === selectedPkg);
    const type = pkg && estimateDiff(pkg.priceMonthly) >= 0 ? "UPGRADE" : "DOWNGRADE";
    setChanging(true); setMsg(null);
    try {
      const res = await fetch(`/api/services/request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType: "hosting", orderId: hosting.id, type, targetPackageId: selectedPkg }),
      });
      const d = await res.json();
      if (res.ok) { setMsg({ type: "ok", text: t("Đã gửi yêu cầu đổi gói, chờ quản trị viên duyệt") }); setPendingChange({ type }); }
      else setMsg({ type: "err", text: d.error || t("Thất bại") });
    } catch { setMsg({ type: "err", text: t("Không thể kết nối") }); }
    finally { setChanging(false); }
  }

  async function openCpanel() {
    setBusy("sso"); setMsg(null);
    try {
      const res = await fetch(`/api/hosting/${hosting.id}/cpanel-sso`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d.data?.url) window.open(d.data.url, "_blank");
      else setMsg({ type: "err", text: d.error || t("Không thể mở cPanel") });
    } catch { setMsg({ type: "err", text: t("Không thể kết nối") }); }
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
      if (res.ok) { setMsg({ type: "ok", text: t("Thao tác thành công") }); setTimeout(() => window.location.reload(), 900); }
      else setMsg({ type: "err", text: d.error || t("Thất bại") });
    } catch { setMsg({ type: "err", text: t("Không thể kết nối") }); }
    finally { setBusy(null); setConfirm(null); setField(""); }
  }

  const isActive = hosting.status === "ACTIVE";
  const isSuspended = hosting.status === "SUSPENDED";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/hosting" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        <Icon d="M19 12H5 M12 19l-7-7 7-7" size={14} /> {t("Quay lại danh sách Hosting")}
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{hosting.domain}</h1>
        <Badge color={statusColor[hosting.status] || "gray"}>{statusLabel[hosting.status] ? t(statusLabel[hosting.status]) : hosting.status}</Badge>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>cPanel: {hosting.cpanelUsername || t("Đang cấp")}</span>
      </div>

      {msg && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, background: msg.type === "ok" ? "var(--green-soft)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--green)" : "var(--red)" }}>{msg.text}</div>}

      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Thông số gói")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          {[
            { label: t("Gói"), val: hosting.package?.name || "-" },
            { label: "Disk", val: `${hosting.package?.storage || "-"} MB` },
            { label: t("Băng thông"), val: hosting.package?.bandwidth === 0 ? "Unlimited" : `${hosting.package?.bandwidth || "-"} MB` },
            { label: "Database", val: hosting.package?.databases === 0 ? "∞" : String(hosting.package?.databases ?? "-") },
            { label: "Email", val: hosting.package?.emailAccounts === 0 ? "∞" : String(hosting.package?.emailAccounts ?? "-") },
            { label: "Server", val: hosting.server?.name || "-" },
            { label: t("Giá"), val: `${formatCurrency(hosting.price)}/th` },
            { label: t("Hết hạn"), val: hosting.expiresAt ? formatDate(hosting.expiresAt) : "—" },
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
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Quản lý")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isActive && <button style={{ ...btn, background: "var(--accent)", color: "white", border: "none" }} disabled={!!busy} onClick={openCpanel}><Icon d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" size={14} /> {busy === "sso" ? t("Đang mở...") : t("Đăng nhập cPanel")}</button>}
            {isActive && <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "change_password", needsPw: true })}><Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" size={14} /> {t("Đổi mật khẩu")}</button>}
            {isActive && <button style={btn} disabled={!!busy} onClick={() => setConfirm({ action: "suspend" })}><Icon d="M10 9v6 M14 9v6 M12 22a10 10 0 100-20 10 10 0 000 20" size={14} /> {t("Tạm dừng")}</button>}
            {isSuspended && <button style={btn} disabled={!!busy} onClick={() => doAction("unsuspend")}><Icon d="M5 3l14 9-14 9V3z" size={14} /> {t("Kích hoạt lại")}</button>}
            <button style={{ ...btn, color: "var(--red)" }} disabled={!!busy} onClick={() => setConfirm({ action: "terminate", danger: true })}><Icon d="M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" size={14} /> {t("Huỷ hosting")}</button>
          </div>
        </div>
      )}

      {/* Change plan */}
      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Đổi gói")}</h3>
        {pendingChange ? (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("Đang chờ duyệt yêu cầu đổi gói")}</p>
        ) : packages.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Không có gói nào khác để đổi.")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select value={selectedPkg} onChange={e => setSelectedPkg(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="">{t("Chọn gói mới")}</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/th</option>
              ))}
            </select>
            {selectedPkg && (() => {
              const pkg = packages.find(p => p.id === selectedPkg);
              if (!pkg) return null;
              const diff = estimateDiff(pkg.priceMonthly);
              return (
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {diff > 0
                    ? <span>{t("Phí chênh lệch (tạm tính, trừ ví khi duyệt):")} {formatCurrency(diff)}</span>
                    : diff < 0
                      ? <span>{t("Hoàn lại (tạm tính, cộng ví khi duyệt):")} {formatCurrency(-diff)}</span>
                      : <span>{t("Không phát sinh chênh lệch.")}</span>}
                </div>
              );
            })()}
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("Yêu cầu đổi gói sẽ được quản trị viên duyệt trước khi áp dụng.")}</p>
            <div>
              <button onClick={changePackage} disabled={!selectedPkg || changing} style={{ ...btn, background: "var(--accent)", color: "white", border: "none", opacity: (!selectedPkg || changing) ? 0.6 : 1 }}>
                {changing ? t("Đang xử lý...") : t("Gửi yêu cầu đổi gói")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancellation */}
      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Yêu cầu huỷ dịch vụ")}</h3>
        {pendingCancel ? (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {t("Đang chờ duyệt yêu cầu huỷ")} — {pendingCancel.cancelMode === "IMMEDIATE" ? t("Huỷ ngay") : t("Huỷ cuối chu kỳ")}
          </p>
        ) : isActive ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Gửi yêu cầu huỷ dịch vụ. Quản trị viên sẽ xem xét và xử lý.")}</p>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("Thời điểm huỷ")}</div>
              <select value={cancelMode} onChange={e => setCancelMode(e.target.value as "END_OF_TERM" | "IMMEDIATE")} style={{ width: "100%", boxSizing: "border-box", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="END_OF_TERM">{t("Cuối chu kỳ hiện tại")}</option>
                <option value="IMMEDIATE">{t("Huỷ ngay lập tức")}</option>
              </select>
            </div>
            <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)} placeholder={t("Lý do (tuỳ chọn)")} rows={3} style={{ width: "100%", boxSizing: "border-box", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
            <div>
              <button onClick={submitCancel} disabled={cancelling} style={{ ...btn, background: "var(--red)", color: "white", border: "none", opacity: cancelling ? 0.6 : 1 }}>
                {cancelling ? t("Đang gửi...") : t("Gửi yêu cầu huỷ")}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Chỉ có thể yêu cầu huỷ khi dịch vụ đang hoạt động.")}</p>
        )}
      </div>

      <ServiceActions serviceType="hosting" orderId={hosting.id} currentPackageId={hosting.packageId} status={hosting.status} />

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setConfirm(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, width: 380, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: confirm.danger ? "var(--red)" : "var(--text-primary)", marginBottom: 12 }}>
              {confirm.action === "terminate" ? t("Huỷ hosting?") : confirm.action === "suspend" ? t("Tạm dừng hosting?") : t("Đổi mật khẩu cPanel")}
            </h3>
            {confirm.danger && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>{t("Hành động này sẽ xoá tài khoản cPanel và không thể hoàn tác.")}</p>}
            {confirm.needsPw && (
              <input type="password" value={field} onChange={e => setField(e.target.value)} placeholder={t("Mật khẩu mới (tối thiểu 8 ký tự)")} style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }} />
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>{t("Huỷ")}</button>
              <button
                onClick={() => doAction(confirm.action, confirm.needsPw ? { password: field } : {})}
                disabled={confirm.needsPw && field.length < 8}
                style={{ flex: 1, padding: 9, background: confirm.danger ? "var(--red)" : "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t("Xác nhận")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
