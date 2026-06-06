"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import ConfigHelp from "@/components/ConfigHelp";
import GameIcon from "@/components/GameIcon";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const inp = { boxSizing: "border-box" as const, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: 13, color: "var(--text-primary)" };

export default function AdminGamesPage() {
  const { t } = useLocale();
  const [games, setGames] = useState<any[]>([]);
  const [globalModules, setGlobalModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [g, setG] = useState({ name: "", icon: "", eggId: "", minRam: "2048", description: "", installScript: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [mod, setMod] = useState({ name: "", priceMonthly: "", description: "" });

  function load() {
    fetch("/api/admin/games").then(r => r.json()).then(d => { setGames(d.data?.games || []); setGlobalModules(d.data?.globalModules || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function seed() { await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seed" }) }); load(); }
  async function addGame(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) });
    if ((await res.json()).success) { setG({ name: "", icon: "", eggId: "", minRam: "2048", description: "", installScript: "" }); setShowForm(false); load(); }
  }
  async function patchGame(id: string, data: any) { await fetch(`/api/admin/games/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); load(); }
  async function delGame(id: string) { if (!confirm(t("Xoá game này?"))) return; await fetch(`/api/admin/games/${id}`, { method: "DELETE" }); load(); }
  async function addModule(gameId: string, e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/games/${gameId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mod) });
    setMod({ name: "", priceMonthly: "", description: "" }); load();
  }
  async function delModule(gameId: string, moduleId: string) { await fetch(`/api/admin/games/${gameId}/modules?moduleId=${moduleId}`, { method: "DELETE" }); load(); }

  if (loading) return <div className="skeleton" style={{ height: 360, borderRadius: "var(--radius-lg)" }} />;

  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" };
  const ModuleList = ({ gameId, mods }: { gameId: string; mods: any[] }) => (
    <div style={{ padding: "12px 16px", background: "var(--bg-elevated)" }}>
      <form onSubmit={e => addModule(gameId, e)} style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input value={mod.name} onChange={e => setMod(p => ({ ...p, name: e.target.value }))} placeholder={t("Tên module")} required style={{ ...inp, width: 200 }} />
        <input type="number" value={mod.priceMonthly} onChange={e => setMod(p => ({ ...p, priceMonthly: e.target.value }))} placeholder={t("Giá/tháng")} style={{ ...inp, width: 120 }} />
        <input value={mod.description} onChange={e => setMod(p => ({ ...p, description: e.target.value }))} placeholder={t("Mô tả")} style={{ ...inp, flex: 1, minWidth: 160 }} />
        <button type="submit" style={{ padding: "8px 14px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Thêm module")}</button>
      </form>
      {mods.length === 0 ? <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("Chưa có module")}</p> : mods.map(m => (
        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-secondary)" }}>{m.name} {Number(m.priceMonthly) > 0 && <span style={{ color: "var(--text-muted)" }}>· {formatCurrency(m.priceMonthly)}</span>}</span>
          <button onClick={() => delModule(gameId, m.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>×</button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Game hosting")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={seed} style={{ padding: "8px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>{t("Seed game mẫu")}</button>
          <button onClick={() => setShowForm(s => !s)} style={{ padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Thêm game")}</button>
        </div>
      </div>

      <ConfigHelp
        help="Map mỗi game tới egg ID của Pterodactyl (cấu hình panel ở Cài đặt → Game panel) để tự cấp server. Hoặc dán Script cài đặt (cloud-init) để tự dựng trên VPS khi không dùng panel. Bấm Seed game mẫu để tạo nhanh."
        docs={[{ label:"Cấu hình Game panel", url:"/admin/settings" }, { label:"Pterodactyl Eggs", url:"https://pterodactyl.io/community/config/eggs/creating_a_custom_egg.html" }]}
      />

      {showForm && (
        <form onSubmit={addGame} style={{ ...card, padding: 16, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input value={g.name} onChange={e => setG(p => ({ ...p, name: e.target.value }))} placeholder={t("Tên game")} required style={inp} />
          <input value={g.icon} onChange={e => setG(p => ({ ...p, icon: e.target.value }))} placeholder={t("URL ảnh icon (tuỳ chọn)")} style={inp} />
          <input value={g.eggId} onChange={e => setG(p => ({ ...p, eggId: e.target.value }))} placeholder={t("Pterodactyl egg ID")} style={inp} />
          <input type="number" value={g.minRam} onChange={e => setG(p => ({ ...p, minRam: e.target.value }))} placeholder={t("RAM tối thiểu (MB)")} style={inp} />
          <input value={g.description} onChange={e => setG(p => ({ ...p, description: e.target.value }))} placeholder={t("Mô tả")} style={{ ...inp, gridColumn: "1/-1" }} />
          <textarea value={g.installScript} onChange={e => setG(p => ({ ...p, installScript: e.target.value }))} placeholder={t("Script cài đặt (cloud-init) cho VPS game — tuỳ chọn")} rows={4} style={{ ...inp, gridColumn: "1/-1", fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
          <button type="submit" style={{ gridColumn: "1/-1", padding: "9px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Lưu game")}</button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {games.length === 0 && <div style={{ ...card, padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{t("Chưa có game. Bấm Seed game mẫu để bắt đầu.")}</div>}
        {games.map(game => (
          <div key={game.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <span style={{ color: "var(--accent)", display: "inline-flex" }}><GameIcon icon={game.icon} size={22} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{game.name} {!game.isActive && <Badge color="gray">{t("Tắt")}</Badge>} {!game.eggId && <Badge color="yellow">{t("Chưa map egg")}</Badge>}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{game.slug} · {game.minRam}MB{game.eggId ? ` · egg ${game.eggId}` : ""}</div>
              </div>
              <button onClick={() => setOpen(open === game.id ? null : game.id)} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>{game.modules?.length || 0} {t("module")}</button>
              <button onClick={() => patchGame(game.id, { isActive: !game.isActive })} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: game.isActive ? "var(--red)" : "var(--green)", fontSize: 11.5, cursor: "pointer" }}>{game.isActive ? t("Tắt") : t("Bật")}</button>
              <button onClick={() => delGame(game.id)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>{t("Xoá")}</button>
            </div>
            {open === game.id && <ModuleList gameId={game.id} mods={game.modules || []} />}
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "26px 0 10px" }}>{t("Module dùng chung (mọi game)")}</h3>
      <div style={{ ...card, overflow: "hidden" }}><ModuleList gameId="global" mods={globalModules} /></div>
    </div>
  );
}
