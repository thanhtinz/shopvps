"use client";
import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

// DNS manager for an active domain (registrar-hosted zone). Lists records and
// supports add / inline-edit / delete via /api/domains/[id]/dns.
type Rec = { id: string; type: string; host: string; value: string; ttl: number; priority?: number };
const TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"];

export default function DnsManager({ domainOrderId }: { domainOrderId: string }) {
  const { t } = useLocale();
  const [records, setRecords] = useState<Rec[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: "A", host: "", value: "", ttl: "3600", priority: "10" });
  const [edit, setEdit] = useState<Record<string, { value: string; ttl: string }>>({});

  const load = useCallback(() => {
    setErr("");
    fetch(`/api/domains/${domainOrderId}/dns`).then(r => r.json()).then(d => {
      if (d.success) setRecords(d.data); else { setRecords([]); setErr(d.error || t("Không tải được DNS")); }
    }).catch(() => { setRecords([]); setErr(t("Không tải được DNS")); });
  }, [domainOrderId, t]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch(`/api/domains/${domainOrderId}/dns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json(); setBusy(false);
    if (res.ok) { setForm({ type: "A", host: "", value: "", ttl: "3600", priority: "10" }); load(); } else setErr(d.error || t("Lỗi"));
  }
  async function save(rec: Rec) {
    const e = edit[rec.id]; if (!e) return; setBusy(true);
    const res = await fetch(`/api/domains/${domainOrderId}/dns`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: rec.id, type: rec.type, host: rec.host, value: e.value, ttl: e.ttl, priority: rec.priority }) });
    setBusy(false); if (res.ok) { setEdit(p => { const n = { ...p }; delete n[rec.id]; return n; }); load(); } else { const d = await res.json(); setErr(d.error || t("Lỗi")); }
  }
  async function del(id: string) {
    if (!confirm(t("Xoá bản ghi này?"))) return; setBusy(true);
    await fetch(`/api/domains/${domainOrderId}/dns?recordId=${encodeURIComponent(id)}`, { method: "DELETE" }); setBusy(false); load();
  }

  const inp = { boxSizing: "border-box" as const, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "var(--text-primary)", fontSize: 12.5, outline: "none" };

  return (
    <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{t("Bản ghi DNS")}</div>
      {err && <div style={{ fontSize: 12.5, color: "var(--red)", marginBottom: 10 }}>{err}</div>}

      {records === null ? <div className="skeleton" style={{ height: 80, borderRadius: "var(--radius-md)" }} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
          {records.length === 0 && !err && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("Chưa có bản ghi")}</div>}
          {records.map(r => {
            const e = edit[r.id];
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr 1.4fr 64px auto", gap: 6, alignItems: "center", fontSize: 12.5 }}>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>{r.type}</span>
                <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.host || "@"}</span>
                {e ? <input value={e.value} onChange={ev => setEdit(p => ({ ...p, [r.id]: { ...p[r.id], value: ev.target.value } }))} style={inp as any} />
                  : <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</span>}
                {e ? <input value={e.ttl} onChange={ev => setEdit(p => ({ ...p, [r.id]: { ...p[r.id], ttl: ev.target.value } }))} style={inp as any} />
                  : <span style={{ color: "var(--text-muted)" }}>{r.ttl}s</span>}
                <span style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  {e ? <button onClick={() => save(r)} disabled={busy} style={{ ...inp as any, color: "var(--green)", cursor: "pointer", border: "1px solid var(--border)" }}>{t("Lưu")}</button>
                    : <button onClick={() => setEdit(p => ({ ...p, [r.id]: { value: r.value, ttl: String(r.ttl) } }))} style={{ ...inp as any, cursor: "pointer", border: "1px solid var(--border)" }}>{t("Sửa")}</button>}
                  <button onClick={() => del(r.id)} disabled={busy} style={{ ...inp as any, color: "var(--red)", cursor: "pointer", border: "1px solid var(--border)" }}>×</button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1.4fr 60px auto", gap: 6, alignItems: "center" }}>
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp as any}>{TYPES.map(ty => <option key={ty} value={ty}>{ty}</option>)}</select>
        <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder={t("Host (vd www, @)")} style={inp as any} />
        <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={t("Giá trị")} required style={inp as any} />
        <input value={form.ttl} onChange={e => setForm(f => ({ ...f, ttl: e.target.value }))} placeholder="TTL" style={inp as any} />
        <button type="submit" disabled={busy} style={{ ...inp as any, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>{t("Thêm")}</button>
      </form>
    </div>
  );
}
