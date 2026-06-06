"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/CartProvider";

const OS_OPTIONS = [
  { id: "ubuntu-22-04", label: "Ubuntu 22.04 LTS" },
  { id: "ubuntu-20-04", label: "Ubuntu 20.04 LTS" },
  { id: "debian-12", label: "Debian 12" },
  { id: "centos-stream-9", label: "CentOS Stream 9" },
  { id: "rocky-linux-9", label: "Rocky Linux 9" },
  { id: "windows-2022", label: "Windows Server 2022" },
];
const REGIONS = [
  { id: "sgp", label: "Singapore" }, { id: "hkg", label: "Hong Kong" }, { id: "nrt", label: "Tokyo" },
  { id: "fra", label: "Frankfurt" }, { id: "ewr", label: "New York" }, { id: "lax", label: "Los Angeles" },
];
const CYCLES = [
  { key: "MONTHLY", label: "1 tháng" }, { key: "QUARTERLY", label: "3 tháng" },
  { key: "SEMI_ANNUAL", label: "6 tháng" }, { key: "ANNUAL", label: "1 năm" },
];

interface VpsPackage {
  id: string; name: string; cpu: number; ram: number; storage: number; bandwidth: number;
  priceMonthly: number; provider: { id: string; name: string };
}
interface HostingPackage {
  id: string; name: string; storage: number; bandwidth: number; databases: number;
  priceMonthly: number; server: { id: string; name: string };
}
interface Product {
  id: string; group: string; category: string; name: string; description: string | null;
  priceMonthly: number; priceYearly: number; setupFee: number;
  specs: Record<string, unknown> | null; stock: number | null;
}
interface GameModule { id: string; name: string; description: string | null; priceMonthly: number; gameId: string | null }
interface Game { id: string; name: string; slug: string; icon: string; description: string | null; minRam: number; modules: GameModule[] }
interface ConfigChoice { id: string; label: string; priceMonthly: number; sortOrder: number }
interface ConfigOption { id: string; name: string; description: string | null; type: "select" | "checkbox"; required: boolean; choices: ConfigChoice[] }
interface Catalog {
  sell_vps: boolean; sell_hosting: boolean; sell_domain: boolean;
  [key: string]: boolean;
}
interface TaxonomyGroup { id: string; label: string }
interface TaxonomyType { group: string; type: string; label: string; autoActivate?: boolean }
interface Taxonomy { groups: TaxonomyGroup[]; types: TaxonomyType[] }
interface GroupSection { id: string; label: string; products: Product[] }

const cardStyle: React.CSSProperties = {
  background: "var(--bg-surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: "18px",
  display: "flex", flexDirection: "column", gap: 10,
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-elevated)", border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-md)", padding: "9px 12px", color: "var(--text-primary)",
  fontSize: 13, outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, display: "block" };

function ConfigSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, fontFamily: "inherit", cursor: "pointer" }}>
      {children}
    </select>
  );
}

function VpsCard({ pkg }: { pkg: VpsPackage }) {
  const { t } = useLocale();
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const [os, setOs] = useState(OS_OPTIONS[0].id);
  const [region, setRegion] = useState(REGIONS[0].id);
  const [cycle, setCycle] = useState(CYCLES[0].key);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  useEffect(() => {
    if (!open || optionsLoaded) return;
    setOptionsLoading(true);
    fetch(`/api/config-options?scope=vps&refId=${pkg.id}`)
      .then((r) => r.json())
      .then((d) => setConfigOptions((d.data || []) as ConfigOption[]))
      .catch(() => setConfigOptions([]))
      .finally(() => { setOptionsLoading(false); setOptionsLoaded(true); });
  }, [open, optionsLoaded, pkg.id]);

  function setSelectChoice(option: ConfigOption, choiceId: string) {
    setSelectedChoices((prev) => {
      const others = prev.filter((id) => !option.choices.some((c) => c.id === id));
      return choiceId ? [...others, choiceId] : others;
    });
  }

  function toggleChoice(choiceId: string) {
    setSelectedChoices((prev) => (prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]));
  }

  function handleAdd() {
    if (!hostname.trim()) { setError(t("Nhập hostname")); return; }
    setError("");
    add({ type: "vps", packageId: pkg.id, packageName: pkg.name, cycle, priceMonthly: Number(pkg.priceMonthly), config: { os, region, hostname: hostname.trim(), options: selectedChoices } });
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(false); setHostname(""); }, 1200);
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>{pkg.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{pkg.provider?.name}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>
          {formatCurrency(pkg.priceMonthly)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>{t("/tháng")}</span>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{pkg.cpu} vCPU · {pkg.ram}MB RAM · {pkg.storage}GB</div>
      <button onClick={() => setOpen((o) => !o)} style={{
        marginTop: 2, padding: "9px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
        background: open ? "var(--accent-soft)" : "var(--bg-elevated)", color: open ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>{t("Cấu hình & thêm")}</button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div>
            <label style={labelStyle}>{t("Hostname")}</label>
            <input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="vps01.example.com" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <label style={labelStyle}>{t("Hệ điều hành")}</label>
            <ConfigSelect value={os} onChange={setOs}>
              {OS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </ConfigSelect>
          </div>
          <div>
            <label style={labelStyle}>{t("Khu vực")}</label>
            <ConfigSelect value={region} onChange={setRegion}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </ConfigSelect>
          </div>
          <div>
            <label style={labelStyle}>{t("Chu kỳ thanh toán")}</label>
            <ConfigSelect value={cycle} onChange={setCycle}>
              {CYCLES.map((c) => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
            </ConfigSelect>
          </div>
          {optionsLoading ? (
            <div className="skeleton" style={{ height: 56, borderRadius: "var(--radius-md)" }} />
          ) : configOptions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{t("Tuỳ chọn cấu hình")}</div>
              {configOptions.map((opt) => (
                <div key={opt.id}>
                  <label style={labelStyle}>
                    {opt.name}
                    {opt.required && <span style={{ color: "var(--red)" }}> *</span>}
                  </label>
                  {opt.type === "select" ? (
                    <ConfigSelect value={selectedChoices.find((id) => opt.choices.some((c) => c.id === id)) || ""} onChange={(v) => setSelectChoice(opt, v)}>
                      {!opt.required && <option value="">{t("Không chọn")}</option>}
                      {opt.choices.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}{c.priceMonthly > 0 ? ` (+${formatCurrency(c.priceMonthly)}${t("/tháng")})` : ""}</option>
                      ))}
                    </ConfigSelect>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {opt.choices.map((c) => (
                        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedChoices.includes(c.id)} onChange={() => toggleChoice(c.id)} />
                          <span>{c.label}{c.priceMonthly > 0 ? ` + ${formatCurrency(c.priceMonthly)}${t("/tháng")}` : ""}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {error && <div style={{ fontSize: 12, color: "var(--red)" }}>{error}</div>}
          {added
            ? <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600, textAlign: "center", padding: "9px" }}>{t("Đã thêm vào giỏ")}</div>
            : <button onClick={handleAdd} style={{ padding: "10px", border: "none", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Thêm vào giỏ")}</button>}
        </div>
      )}
    </div>
  );
}

function HostingCard({ pkg }: { pkg: HostingPackage }) {
  const { t } = useLocale();
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [cycle, setCycle] = useState(CYCLES[0].key);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  useEffect(() => {
    if (!open || optionsLoaded) return;
    setOptionsLoading(true);
    fetch(`/api/config-options?scope=hosting&refId=${pkg.id}`)
      .then((r) => r.json())
      .then((d) => setConfigOptions((d.data || []) as ConfigOption[]))
      .catch(() => setConfigOptions([]))
      .finally(() => { setOptionsLoading(false); setOptionsLoaded(true); });
  }, [open, optionsLoaded, pkg.id]);

  function setSelectChoice(option: ConfigOption, choiceId: string) {
    setSelectedChoices((prev) => {
      const others = prev.filter((id) => !option.choices.some((c) => c.id === id));
      return choiceId ? [...others, choiceId] : others;
    });
  }

  function toggleChoice(choiceId: string) {
    setSelectedChoices((prev) => (prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]));
  }

  function handleAdd() {
    if (!domain.trim()) { setError(t("Nhập tên miền")); return; }
    setError("");
    add({ type: "hosting", packageId: pkg.id, packageName: pkg.name, cycle, priceMonthly: Number(pkg.priceMonthly), config: { domain: domain.trim(), options: selectedChoices } });
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(false); setDomain(""); }, 1200);
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>{pkg.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{pkg.server?.name}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>
          {formatCurrency(pkg.priceMonthly)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>{t("/tháng")}</span>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{pkg.storage}GB · {pkg.bandwidth}GB · {pkg.databases} DB</div>
      <button onClick={() => setOpen((o) => !o)} style={{
        marginTop: 2, padding: "9px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
        background: open ? "var(--accent-soft)" : "var(--bg-elevated)", color: open ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>{t("Cấu hình & thêm")}</button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div>
            <label style={labelStyle}>{t("Tên miền")}</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <label style={labelStyle}>{t("Chu kỳ thanh toán")}</label>
            <ConfigSelect value={cycle} onChange={setCycle}>
              {CYCLES.map((c) => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
            </ConfigSelect>
          </div>
          {optionsLoading ? (
            <div className="skeleton" style={{ height: 56, borderRadius: "var(--radius-md)" }} />
          ) : configOptions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{t("Tuỳ chọn cấu hình")}</div>
              {configOptions.map((opt) => (
                <div key={opt.id}>
                  <label style={labelStyle}>
                    {opt.name}
                    {opt.required && <span style={{ color: "var(--red)" }}> *</span>}
                  </label>
                  {opt.type === "select" ? (
                    <ConfigSelect value={selectedChoices.find((id) => opt.choices.some((c) => c.id === id)) || ""} onChange={(v) => setSelectChoice(opt, v)}>
                      {!opt.required && <option value="">{t("Không chọn")}</option>}
                      {opt.choices.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}{c.priceMonthly > 0 ? ` (+${formatCurrency(c.priceMonthly)}${t("/tháng")})` : ""}</option>
                      ))}
                    </ConfigSelect>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {opt.choices.map((c) => (
                        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedChoices.includes(c.id)} onChange={() => toggleChoice(c.id)} />
                          <span>{c.label}{c.priceMonthly > 0 ? ` + ${formatCurrency(c.priceMonthly)}${t("/tháng")}` : ""}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {error && <div style={{ fontSize: 12, color: "var(--red)" }}>{error}</div>}
          {added
            ? <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600, textAlign: "center", padding: "9px" }}>{t("Đã thêm vào giỏ")}</div>
            : <button onClick={handleAdd} style={{ padding: "10px", border: "none", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Thêm vào giỏ")}</button>}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, labelPlaceholder, typeLabel, games }: { product: Product; labelPlaceholder: string; typeLabel?: string; games: Game[] }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [cycle, setCycle] = useState(CYCLES[0].key);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isGameServer = product.category === "game-server";
  const [gameId, setGameId] = useState("");
  const [moduleIds, setModuleIds] = useState<string[]>([]);

  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  useEffect(() => {
    if (!open || optionsLoaded) return;
    setOptionsLoading(true);
    fetch(`/api/config-options?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setConfigOptions((d.data || []) as ConfigOption[]))
      .catch(() => setConfigOptions([]))
      .finally(() => { setOptionsLoading(false); setOptionsLoaded(true); });
  }, [open, optionsLoaded, product.id]);

  function setSelectChoice(option: ConfigOption, choiceId: string) {
    setSelectedChoices((prev) => {
      const others = prev.filter((id) => !option.choices.some((c) => c.id === id));
      return choiceId ? [...others, choiceId] : others;
    });
  }

  function toggleChoice(choiceId: string) {
    setSelectedChoices((prev) => (prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]));
  }

  const selectedGame = games.find((g) => g.id === gameId) || null;
  const availableModules = selectedGame
    ? games.flatMap((g) => g.modules).filter((mod) => mod.gameId === selectedGame.id || mod.gameId == null)
    : [];

  const outOfStock = product.stock != null && product.stock <= 0;
  const specEntries = product.specs ? Object.entries(product.specs) : [];

  function toggleModule(modId: string) {
    setModuleIds((prev) => (prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]));
  }

  async function handleBuy() {
    setError("");
    if (isGameServer && !gameId) { setError(t("Vui lòng chọn game")); return; }
    setSubmitting(true);
    try {
      const body: { productId: string; billingCycle: string; label?: string; config?: { gameId?: string; moduleIds?: string[]; options?: string[] } } = {
        productId: product.id, billingCycle: cycle, label: label.trim() || undefined,
      };
      const config: { gameId?: string; moduleIds?: string[]; options?: string[] } = {};
      if (isGameServer) { config.gameId = gameId; config.moduleIds = moduleIds; }
      if (selectedChoices.length > 0) config.options = selectedChoices;
      if (Object.keys(config).length > 0) body.config = config;
      const res = await fetch("/api/products/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "");
      } else {
        setDone(true);
      }
    } catch {
      setError("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>{product.name}</div>
          {typeLabel && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginTop: 2 }}>{typeLabel}</div>}
          {product.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{product.description}</div>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>
          {formatCurrency(product.priceMonthly)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>{t("/tháng")}</span>
        </div>
      </div>
      {specEntries.length > 0 && (
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 2 }}>
          {specEntries.map(([k, v]) => <div key={k}>{k}: {String(v)}</div>)}
        </div>
      )}
      {product.setupFee > 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("Phí cài đặt:")} {formatCurrency(product.setupFee)}</div>
      )}
      {product.stock != null && (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("Còn lại:")} {product.stock}</div>
      )}
      <button onClick={() => setOpen((o) => !o)} disabled={outOfStock} style={{
        marginTop: 2, padding: "9px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
        background: open ? "var(--accent-soft)" : "var(--bg-elevated)", color: open ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 13, fontWeight: 600, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.5 : 1,
      }}>{outOfStock ? t("Hết hàng") : t("Cấu hình & mua")}</button>

      {open && !outOfStock && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div>
            <label style={labelStyle}>{t("Nhãn dịch vụ (tuỳ chọn)")}</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={labelPlaceholder} style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <label style={labelStyle}>{t("Chu kỳ thanh toán")}</label>
            <ConfigSelect value={cycle} onChange={setCycle}>
              {CYCLES.map((c) => <option key={c.key} value={c.key}>{t(c.label)}</option>)}
            </ConfigSelect>
          </div>
          {isGameServer && (
            <>
              <div>
                <label style={labelStyle}>{t("Chọn game")}</label>
                <ConfigSelect value={gameId} onChange={(v) => { setGameId(v); setModuleIds([]); }}>
                  <option value="">{t("Chọn game")}</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </ConfigSelect>
              </div>
              {selectedGame && availableModules.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {availableModules.map((mod) => (
                    <label key={mod.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                      <input type="checkbox" checked={moduleIds.includes(mod.id)} onChange={() => toggleModule(mod.id)} />
                      <span>{mod.name}{mod.priceMonthly > 0 ? ` + ${formatCurrency(mod.priceMonthly)}${t("/tháng")}` : ""}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
          {optionsLoading ? (
            <div className="skeleton" style={{ height: 56, borderRadius: "var(--radius-md)" }} />
          ) : configOptions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)" }}>{t("Tuỳ chọn cấu hình")}</div>
              {configOptions.map((opt) => (
                <div key={opt.id}>
                  <label style={labelStyle}>
                    {opt.name}
                    {opt.required && <span style={{ color: "var(--red)" }}> *</span>}
                  </label>
                  {opt.type === "select" ? (
                    <ConfigSelect value={selectedChoices.find((id) => opt.choices.some((c) => c.id === id)) || ""} onChange={(v) => setSelectChoice(opt, v)}>
                      {!opt.required && <option value="">{t("Không chọn")}</option>}
                      {opt.choices.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}{c.priceMonthly > 0 ? ` (+${formatCurrency(c.priceMonthly)}${t("/tháng")})` : ""}</option>
                      ))}
                    </ConfigSelect>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {opt.choices.map((c) => (
                        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                          <input type="checkbox" checked={selectedChoices.includes(c.id)} onChange={() => toggleChoice(c.id)} />
                          <span>{c.label}{c.priceMonthly > 0 ? ` + ${formatCurrency(c.priceMonthly)}${t("/tháng")}` : ""}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {error && <div style={{ fontSize: 12, color: "var(--red)" }}>{error}</div>}
          {done
            ? (
              <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600, textAlign: "center", padding: "9px", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>{t("Đặt hàng thành công")}</span>
                <Link href="/products" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>{t("Xem dịch vụ")}</Link>
              </div>
            )
            : <button onClick={handleBuy} disabled={submitting} style={{ padding: "10px", border: "none", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? t("Đang xử lý...") : t("Mua ngay")}</button>}
        </div>
      )}
    </div>
  );
}

export default function StorePage() {
  const { t } = useLocale();
  const { count } = useCart();
  const [vps, setVps] = useState<VpsPackage[]>([]);
  const [hosting, setHosting] = useState<HostingPackage[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [groupSections, setGroupSections] = useState<GroupSection[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/vps/packages").then((r) => r.json()),
      fetch("/api/hosting/packages").then((r) => r.json()),
      fetch("/api/catalog").then((r) => r.json()),
      fetch("/api/products/taxonomy").then((r) => r.json()),
      fetch("/api/games").then((r) => r.json()).catch(() => ({})),
    ]).then(async ([v, h, c, tax, g]) => {
      setVps(v.data || []);
      setHosting(h.data || []);
      setGames(g.data || []);
      const cat: Catalog | null = c.data || null;
      setCatalog(cat);
      const taxData: Taxonomy = { groups: tax.data?.groups || [], types: tax.data?.types || [] };
      setTaxonomy(taxData);

      const enabledGroups = taxData.groups.filter((g) => cat?.[`sell_group_${g.id}`]);
      const fetched = await Promise.all(
        enabledGroups.map(async (g) => {
          const res = await fetch(`/api/products?group=${g.id}`).then((r) => r.json()).catch(() => ({}));
          return { id: g.id, label: g.label, products: (res.data || []) as Product[] };
        })
      );
      setGroupSections(fetched.filter((s) => s.products.length > 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const typeLabel = (slug: string): string => {
    const found = taxonomy?.types.find((t2) => t2.type === slug);
    return found?.label || slug;
  };

  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{t("Cửa hàng")}</h1>
        <Link href="/cart" style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)",
          color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none",
        }}>
          {t("Giỏ hàng")}
          <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: "var(--accent)", color: "white", fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{count}</span>
        </Link>
      </div>

      {loading ? (
        <div style={gridStyle}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : (
        <>
          {catalog?.sell_vps && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Máy chủ VPS")}</h2>
              {vps.length === 0
                ? <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>{t("Không có gói nào")}</div>
                : <div style={gridStyle}>{vps.map((p) => <VpsCard key={p.id} pkg={p} />)}</div>}
            </section>
          )}

          {catalog?.sell_hosting && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Hosting")}</h2>
              {hosting.length === 0
                ? <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>{t("Không có gói nào")}</div>
                : <div style={gridStyle}>{hosting.map((p) => <HostingCard key={p.id} pkg={p} />)}</div>}
            </section>
          )}

          {groupSections.map((sec) => (
            <section key={sec.id} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{sec.label}</h2>
              <div style={gridStyle}>
                {sec.products.map((p) => (
                  <ProductCard key={p.id} product={p} labelPlaceholder="srv01" typeLabel={typeLabel(p.category)} games={games} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
