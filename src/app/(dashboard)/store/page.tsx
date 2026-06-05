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

  function handleAdd() {
    if (!hostname.trim()) { setError(t("Nhập hostname")); return; }
    setError("");
    add({ type: "vps", packageId: pkg.id, packageName: pkg.name, cycle, priceMonthly: Number(pkg.priceMonthly), config: { os, region, hostname: hostname.trim() } });
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

  function handleAdd() {
    if (!domain.trim()) { setError(t("Nhập tên miền")); return; }
    setError("");
    add({ type: "hosting", packageId: pkg.id, packageName: pkg.name, cycle, priceMonthly: Number(pkg.priceMonthly), config: { domain: domain.trim() } });
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
          {error && <div style={{ fontSize: 12, color: "var(--red)" }}>{error}</div>}
          {added
            ? <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600, textAlign: "center", padding: "9px" }}>{t("Đã thêm vào giỏ")}</div>
            : <button onClick={handleAdd} style={{ padding: "10px", border: "none", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Thêm vào giỏ")}</button>}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/vps/packages").then((r) => r.json()),
      fetch("/api/hosting/packages").then((r) => r.json()),
    ]).then(([v, h]) => {
      setVps(v.data || []);
      setHosting(h.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Máy chủ VPS")}</h2>
            {vps.length === 0
              ? <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>{t("Không có gói nào")}</div>
              : <div style={gridStyle}>{vps.map((p) => <VpsCard key={p.id} pkg={p} />)}</div>}
          </section>

          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>{t("Hosting")}</h2>
            {hosting.length === 0
              ? <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 13 }}>{t("Không có gói nào")}</div>
              : <div style={gridStyle}>{hosting.map((p) => <HostingCard key={p.id} pkg={p} />)}</div>}
          </section>
        </>
      )}
    </div>
  );
}
