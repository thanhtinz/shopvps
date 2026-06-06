"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import GamePanel from "@/components/GamePanel";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>;
}

type Cronjob = {
  id: string;
  name: string;
  url: string;
  method: string;
  schedule: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
};

type GameModule = { id: string; name: string; description: string | null; priceMonthly: number; gameId: string | null };
type Game = { id: string; name: string; slug: string; icon: string; description: string | null; minRam: number; modules: GameModule[] };

type ConfigChoice = { id: string; label: string; priceMonthly: number; sortOrder: number };
type ConfigOption = { id: string; name: string; description: string | null; type: "select" | "checkbox"; required: boolean; choices: ConfigChoice[] };

type Detail = {
  id: string;
  label: string;
  group: string;
  category: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";
  billingCycle: string;
  price: number;
  createdAt: string;
  expiresAt: string | null;
  product: { id?: string; name: string; category: string; group: string; specs: any };
  credentials: string | null;
  cronjobs: Cronjob[];
  config?: { gameId?: string; moduleIds?: string[]; options?: string[] } | null;
  data?: { panelUrl?: string; panelIdentifier?: string } | null;
};

const card: React.CSSProperties = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 };
const btn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 };

export default function ProductDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const id = String(params?.id || "");

  const [order, setOrder] = useState<Detail | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: "", url: "", method: "GET", schedule: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products/taxonomy").then(r => r.json()).then(d => {
      const types: Array<{ type: string; label: string }> = d.data?.types || [];
      const groups: Array<{ id: string; label: string }> = d.data?.groups || [];
      const tl: Record<string, string> = {};
      for (const ty of types) tl[ty.type] = ty.label;
      const gl: Record<string, string> = {};
      for (const g of groups) gl[g.id] = g.label;
      setTypeLabels(tl);
      setGroupLabels(gl);
    }).catch(() => {});
  }, []);

  const typeLabel = (slug: string) => typeLabels[slug] || slug;
  const groupLabel = (id: string) => groupLabels[id] || id;

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/products/orders/${id}`).then(r => r.json()).then(d => {
      setOrder(d.data || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (order?.config?.gameId && games.length === 0) {
      fetch("/api/games").then(r => r.json()).then(d => setGames(d.data || [])).catch(() => {});
    }
  }, [order?.config?.gameId, games.length]);

  const selectedOptionIds = order?.config?.options;
  const detailProductId = order?.product?.id;
  useEffect(() => {
    if (selectedOptionIds && selectedOptionIds.length > 0 && detailProductId) {
      fetch(`/api/config-options?productId=${detailProductId}`)
        .then(r => r.json())
        .then(d => setConfigOptions((d.data || []) as ConfigOption[]))
        .catch(() => {});
    }
  }, [selectedOptionIds, detailProductId]);

  const statusColor: Record<string, "green" | "yellow" | "gray" | "red"> = { ACTIVE: "green", PENDING: "yellow", SUSPENDED: "gray", TERMINATED: "red" };
  const statusLabel: Record<string, string> = { ACTIVE: t("Đang hoạt động"), PENDING: t("Chờ kích hoạt"), SUSPENDED: t("Tạm dừng"), TERMINATED: t("Đã huỷ") };

  async function addCronjob() {
    setError(""); setAdding(true);
    try {
      const res = await fetch(`/api/products/orders/${id}/cronjobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setForm({ name: "", url: "", method: "GET", schedule: "" }); load(); }
      else setError(data.error || t("Không thể thêm cronjob"));
    } catch { setError(t("Không thể kết nối")); }
    finally { setAdding(false); }
  }

  async function toggleCronjob(c: Cronjob) {
    await fetch(`/api/products/orders/${id}/cronjobs/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function deleteCronjob(cronId: string) {
    await fetch(`/api/products/orders/${id}/cronjobs/${cronId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div style={{ maxWidth: 980, margin: "0 auto" }}><div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} /></div>;
  if (!order) return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        <Icon d="M19 12H5 M12 19l-7-7 7-7" size={14} /> {t("Quay lại")}
      </Link>
      <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>{t("Không tìm thấy dịch vụ.")}</p>
    </div>
  );

  const specs = order.product?.specs && typeof order.product.specs === "object" ? order.product.specs : null;
  const isCronjob = order.category === "cronjob" || order.product?.category === "cronjob";
  const showCronManager = isCronjob && order.status === "ACTIVE";

  const isGameServer = order.category === "game-server" || order.product?.category === "game-server";
  const gameId = order.config?.gameId || null;
  const selectedGame = gameId ? games.find(g => g.id === gameId) || null : null;
  const allModules = games.flatMap(g => g.modules);
  const selectedModules = (order.config?.moduleIds || [])
    .map(mid => allModules.find(mod => mod.id === mid))
    .filter((mod): mod is GameModule => !!mod);
  const panelUrl = order.data?.panelUrl || null;
  const panelIdentifier = order.data?.panelIdentifier || null;

  const selectedOptionIdList = order.config?.options || [];
  const allChoices = configOptions.flatMap(o => o.choices);
  const selectedChoices = selectedOptionIdList
    .map(cid => allChoices.find(c => c.id === cid))
    .filter((c): c is ConfigChoice => !!c);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        <Icon d="M19 12H5 M12 19l-7-7 7-7" size={14} /> {t("Quay lại")}
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{order.product?.name}</h1>
        <Badge color={statusColor[order.status] || "gray"}>{statusLabel[order.status] || order.status}</Badge>
        <Badge color="blue">{typeLabel(order.category)}</Badge>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{groupLabel(order.group)}</span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{order.label}</span>
      </div>

      {/* Info / specs */}
      <div style={card}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Thông số")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          {[
            { label: t("Chu kỳ"), val: order.billingCycle || "-" },
            { label: t("Giá"), val: formatCurrency(order.price) },
            { label: t("Ngày tạo"), val: order.createdAt ? formatDate(order.createdAt) : "—" },
            { label: t("Hết hạn"), val: order.expiresAt ? formatDate(order.expiresAt) : "—" },
            ...(specs ? Object.entries(specs).map(([k, v]) => ({ label: k, val: String(v) })) : []),
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Game server */}
      {isGameServer && gameId && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Game")}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            {selectedGame ? <><span>{selectedGame.icon}</span><span>{selectedGame.name}</span></> : <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{gameId}</span>}
          </div>
          {selectedModules.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("Module đã chọn")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedModules.map(mod => (
                  <span key={mod.id} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "5px 10px" }}>{mod.name}</span>
                ))}
              </div>
            </div>
          )}
          {panelUrl && !panelIdentifier ? (
            <a href={panelUrl} target="_blank" rel="noopener noreferrer" style={{ ...btn, display: "inline-flex", marginTop: 16, background: "var(--accent)", color: "white", border: "none", fontWeight: 700, textDecoration: "none" }}>{t("Mở bảng điều khiển")}</a>
          ) : !panelIdentifier && order.status === "PENDING" ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16, marginBottom: 0 }}>{t("Server game đang được tạo...")}</p>
          ) : null}
        </div>
      )}

      {/* Embedded professional game control panel (Pterodactyl) */}
      {isGameServer && panelIdentifier && <GamePanel orderId={order.id} panelUrl={panelUrl} />}

      {/* Configurable options */}
      {selectedOptionIdList.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Tuỳ chọn đã chọn")}</h3>
          {selectedChoices.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {selectedChoices.map(c => (
                <span key={c.id} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "5px 10px" }}>
                  {c.label}{c.priceMonthly > 0 ? ` + ${formatCurrency(c.priceMonthly)}${t("/tháng")}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{selectedOptionIdList.length} {t("tuỳ chọn")}</p>
          )}
        </div>
      )}

      {/* Credentials */}
      {(order.credentials || order.status === "PENDING") && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Thông tin truy cập")}</h3>
          {order.credentials ? (
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "12px 14px", borderRadius: "var(--radius-md)", whiteSpace: "pre-wrap", wordBreak: "break-all", overflowX: "auto" }}>{order.credentials}</pre>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Dịch vụ đang chờ được kích hoạt.")}</p>
          )}
        </div>
      )}

      {/* Cronjob manager */}
      {showCronManager && (
        <div style={card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Quản lý cronjob")}</h3>

          {order.cronjobs && order.cronjobs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {order.cronjobs.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{c.method} {c.url}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{c.schedule}</span>
                      {" · "}{t("Chạy lần cuối")}: {c.lastRunAt ? formatDate(c.lastRunAt) : "—"}
                      {c.lastStatus ? ` (${c.lastStatus})` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => toggleCronjob(c)} style={btn}>
                      {c.isActive ? t("Đang bật") : t("Đang tắt")}
                    </button>
                    <button onClick={() => deleteCronjob(c.id)} style={{ ...btn, color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }}>{t("Xoá")}</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>{t("Chưa có cronjob nào.")}</p>
          )}

          {error && <div style={{ background: "var(--red-soft)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>{t("Thêm cronjob")}</h4>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("Tên")}</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("URL")}</div>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 120px" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("Phương thức")}</div>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={inputStyle}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{t("Lịch (cron)")}</div>
                <input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="*/5 * * * *" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{t("Định dạng cron 5 trường, vd */5 * * * * = mỗi 5 phút")}</p>
            <div>
              <button onClick={addCronjob} disabled={adding} style={{ ...btn, background: "var(--accent)", color: "white", border: "none", opacity: adding ? 0.6 : 1 }}>
                {adding ? t("Đang xử lý...") : t("Thêm cronjob")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
