"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminStaffPage() {
  const { t } = useLocale();
  const [staff, setStaff] = useState<any[]>([]);
  const [modules, setModules] = useState<{ key: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/staff").then(r => r.json()).then(d => {
      if (d.success) { setStaff(d.data.staff); setModules(d.data.modules); }
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  function open(u: any) { setEditing(u); setPerms(Array.isArray(u.adminPermissions) ? u.adminPermissions : []); }
  function toggle(k: string) { setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]); }
  async function save() {
    setSaving(true);
    await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: editing.id, permissions: perms }) });
    setSaving(false); setEditing(null); load();
  }
  async function demote(u: any) {
    if (!confirm(t("Gỡ quyền admin của người này?"))) return;
    await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, role: "USER", permissions: [] }) });
    load();
  }

  if (loading) return <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />;
  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>{t("Nhân viên & phân quyền")}</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>{t("Cấp quyền truy cập từng module cho admin. Super Admin có toàn quyền.")}</p>

      <div style={{ ...card, overflow: "hidden" }}>
        {staff.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{u.name || u.email} {u.role === "SUPER_ADMIN" ? <Badge color="red">Super Admin</Badge> : <Badge color="blue">Admin</Badge>}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{u.email}</div>
              {u.role === "ADMIN" && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{Array.isArray(u.adminPermissions) && u.adminPermissions.length ? `${u.adminPermissions.length} ${t("module được phép")}` : t("Chưa cấp quyền nào")}</div>}
            </div>
            {u.role === "ADMIN" && (
              <>
                <button onClick={() => open(u)} style={{ padding: "7px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Phân quyền")}</button>
                <button onClick={() => demote(u)} style={{ padding: "7px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 12.5, cursor: "pointer" }}>{t("Gỡ admin")}</button>
              </>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setEditing(null)}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 24, width: 560, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{editing.name || editing.email}</h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 16 }}>{t("Chọn các module admin này được phép truy cập")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              {modules.map(m => (
                <label key={m.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer", padding: "9px 11px", background: perms.includes(m.key) ? "var(--accent-soft)" : "var(--bg-surface)", border: `1px solid ${perms.includes(m.key) ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-md)" }}>
                  <input type="checkbox" checked={perms.includes(m.key)} onChange={() => toggle(m.key)} style={{ marginTop: 2 }} />
                  <span>{t(m.label)}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 11, background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? t("Đang lưu...") : t("Lưu quyền")}</button>
              <button onClick={() => setEditing(null)} style={{ padding: "11px 18px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>{t("Đóng")}</button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 12, marginBottom: 0 }}>{t("Lưu ý: admin cần đăng nhập lại để quyền mới có hiệu lực.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
