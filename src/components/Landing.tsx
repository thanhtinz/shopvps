"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import PublicShell, { SHELL_COLORS as C } from "@/components/PublicShell";
import { formatCurrency } from "@/lib/utils";

type LandingData = {
  appName: string;
  tagline: string;
  stats: { uptime: string; customers: string; servers: string; datacenters: string };
  counts: { games: number; providers: number; tlds: number };
  contact: { email?: string; phone?: string; zalo?: string; discord?: string; address?: string };
};

type VpsPackage = {
  id: string;
  name: string;
  cpu: string | number;
  ram: string | number;
  storage: string | number;
  bandwidth: string | number;
  priceMonthly: number;
  priceYearly: number;
  provider?: { name?: string };
};

type Tld = { tld: string; registerPrice: number };

type DomainCheck = {
  domain: string;
  available: boolean | null;
  registerPrice?: number;
  transferPrice?: number;
  unknown?: boolean;
};

const card: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 18,
  padding: 24,
};

const sectionPad: React.CSSProperties = {
  padding: "clamp(56px,8vw,96px) clamp(16px,4vw,48px)",
};

const inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

// Simple stroke icons (inline SVG)
function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  server: "M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.7 4 6.2 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.2-4-10s1.5-7.3 4-10z",
  lock: "M7 11V7a5 5 0 0110 0v4M5 11h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z",
  gamepad: "M6 12h4m-2-2v4M15 11h.01M18 13h.01M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.544-.604-6.584-.685-7.258a4 4 0 00-3.995-3.742z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  cloud: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  card: "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zM2 10h20",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  headset: "M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M12 5l7 7-7 7",
  search: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
};

export default function Landing() {
  const { t } = useLocale();
  const [data, setData] = useState<LandingData | null>(null);
  const [packages, setPackages] = useState<VpsPackage[]>([]);
  const [tlds, setTlds] = useState<Tld[]>([]);

  useEffect(() => {
    fetch("/api/landing")
      .then((r) => r.json())
      .then((j) => setData(j?.data || null))
      .catch(() => {});
    fetch("/api/vps/packages")
      .then((r) => r.json())
      .then((j) => setPackages(Array.isArray(j?.data) ? j.data : []))
      .catch(() => {});
    fetch("/api/domains/tlds")
      .then((r) => r.json())
      .then((j) => setTlds(Array.isArray(j?.data) ? j.data : []))
      .catch(() => {});
  }, []);

  const appName = data?.appName || "ShopVPS";
  const cheapest = useMemo(
    () => [...packages].sort((a, b) => Number(a.priceMonthly) - Number(b.priceMonthly)).slice(0, 3),
    [packages]
  );

  return (
    <PublicShell appName={appName} contact={data?.contact} onLanding>
      <Hero data={data} tlds={tlds} t={t} />
      <Stats data={data} t={t} />
      <Products t={t} />
      <Features t={t} />
      <HowItWorks t={t} />
      <Pricing packages={cheapest} t={t} />
      <Testimonials t={t} />
      <PaymentRow t={t} />
      <Faq t={t} />
      <CtaBand t={t} />
    </PublicShell>
  );
}

/* ---------------- HERO ---------------- */
function Hero({ data, tlds, t }: { data: LandingData | null; tlds: Tld[]; t: (k: string) => string }) {
  const [domain, setDomain] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DomainCheck | null>(null);
  const [err, setErr] = useState("");

  const check = async () => {
    const d = domain.trim().toLowerCase();
    if (!d) return;
    setChecking(true);
    setResult(null);
    setErr("");
    try {
      const r = await fetch(`/api/domains/check?domain=${encodeURIComponent(d)}`);
      const j = await r.json();
      if (j?.error) setErr(String(j.error));
      else setResult(j?.data || null);
    } catch {
      setErr(t("Không kiểm tra được tên miền. Vui lòng thử lại."));
    } finally {
      setChecking(false);
    }
  };

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(64px,10vw,120px) clamp(16px,4vw,48px) clamp(48px,7vw,80px)",
      }}
    >
      {/* grid background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%,#000 40%,transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%,#000 40%,transparent 100%)",
        }}
      />
      {/* gradient glows */}
      <div aria-hidden style={glow("-10%", "-5%", "rgba(79,124,255,0.22)")} />
      <div aria-hidden style={glow("auto", "-8%", "rgba(124,58,237,0.2)", "0%")} />

      <div style={{ ...inner, position: "relative", textAlign: "center" }}>
        <span style={badge}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
          {data?.tagline ? data.tagline : t("Platform VPS & Hosting chuyên nghiệp")}
        </span>

        <h1
          style={{
            fontSize: "clamp(34px,6vw,64px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "22px auto 0",
            maxWidth: 880,
          }}
        >
          {t("Hạ tầng số toàn diện")}
          <br />
          <span
            style={{
              background: C.grad,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("VPS, Hosting, Tên miền & SSL")}
          </span>
        </h1>

        <p style={{ fontSize: "clamp(15px,2vw,19px)", color: C.muted, maxWidth: 620, margin: "20px auto 0", lineHeight: 1.7 }}>
          {t("Triển khai server trong vài phút, quản lý tên miền, SSL và game hosting từ một bảng điều khiển. Thanh toán tự động cho thị trường Việt Nam.")}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
          <Link href="/register" style={btnPrimary}>
            {t("Đăng ký miễn phí")}
            <Icon d={ICONS.arrow} size={17} />
          </Link>
          <Link href="#pricing" style={btnGhost}>
            {t("Xem bảng giá")}
          </Link>
        </div>

        {/* domain search */}
        <div style={{ maxWidth: 560, margin: "40px auto 0" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 7,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, paddingLeft: 12, color: C.muted }}>
              <Icon d={ICONS.search} size={18} />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && check()}
                placeholder={t("Tìm tên miền hoàn hảo của bạn…")}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: C.text,
                  fontSize: 15,
                  fontFamily: "inherit",
                  padding: "10px 0",
                }}
              />
            </div>
            <button onClick={check} disabled={checking} style={{ ...btnPrimary, padding: "11px 22px", opacity: checking ? 0.7 : 1 }}>
              {checking ? t("Đang kiểm tra…") : t("Kiểm tra")}
            </button>
          </div>

          {err ? <p style={{ color: "#f87171", fontSize: 13.5, marginTop: 12 }}>{err}</p> : null}
          {result ? (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                textAlign: "left",
              }}
            >
              <span style={{ fontWeight: 700 }}>{result.domain}</span>
              {result.unknown || result.available === null ? (
                <span style={{ color: C.muted, fontSize: 13.5 }}>{t("Chưa rõ tình trạng — vui lòng đăng nhập để kiểm tra chi tiết.")}</span>
              ) : result.available ? (
                <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}>✓ {t("Còn trống")}</span>
                  {result.registerPrice != null ? (
                    <span style={{ color: C.text, fontSize: 14 }}>{formatCurrency(result.registerPrice)}{t("/năm")}</span>
                  ) : null}
                  <Link href="/register" style={{ ...btnPrimary, padding: "7px 14px", fontSize: 13 }}>{t("Đăng ký ngay")}</Link>
                </span>
              ) : (
                <span style={{ color: "#f87171", fontWeight: 700, fontSize: 14 }}>{t("Đã có người đăng ký")}</span>
              )}
            </div>
          ) : null}

          {tlds.length ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              {tlds.slice(0, 6).map((x) => (
                <span key={x.tld} style={chip}>
                  {x.tld.startsWith(".") ? x.tld : `.${x.tld}`}
                  <span style={{ color: C.muted, marginLeft: 6 }}>{formatCurrency(x.registerPrice)}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------------- STATS ---------------- */
function Stats({ data, t }: { data: LandingData | null; t: (k: string) => string }) {
  const s = data?.stats;
  const items = [
    { v: s?.uptime || "99.9%", l: t("Uptime") },
    { v: s?.customers || "1,000+", l: t("Khách hàng") },
    { v: s?.servers || "50+", l: t("Server") },
    { v: s?.datacenters || "5+", l: t("Data center") },
  ];
  const c = data?.counts;
  return (
    <section style={{ padding: "clamp(8px,2vw,24px) clamp(16px,4vw,48px)" }}>
      <div style={inner}>
        <div
          style={{
            ...card,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 16,
            padding: "clamp(24px,4vw,36px)",
            background: "linear-gradient(135deg,rgba(79,124,255,0.08),rgba(124,58,237,0.06))",
          }}
        >
          {items.map((it) => (
            <div key={it.l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(26px,4vw,40px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: C.grad,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {it.v}
              </div>
              <div style={{ color: C.muted, fontSize: 13.5, marginTop: 4 }}>{it.l}</div>
            </div>
          ))}
        </div>
        {c ? (
          <p style={{ textAlign: "center", color: C.faint, fontSize: 13, marginTop: 16 }}>
            {t("Đa dạng dịch vụ")}: {c.games} {t("game")} · {c.providers} {t("nhà cung cấp")} · {c.tlds} {t("đuôi tên miền")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ---------------- PRODUCTS ---------------- */
function Products({ t }: { t: (k: string) => string }) {
  const items = [
    { icon: ICONS.server, title: t("VPS"), desc: t("Máy chủ ảo NVMe hiệu năng cao, khởi tạo tức thì.") },
    { icon: ICONS.cloud, title: t("Hosting"), desc: t("Web hosting tốc độ cao với cPanel/DirectAdmin.") },
    { icon: ICONS.globe, title: t("Tên miền"), desc: t("Đăng ký, chuyển và quản lý tên miền dễ dàng.") },
    { icon: ICONS.lock, title: t("SSL"), desc: t("Chứng chỉ SSL DV/OV/EV, cấp tự động Let's Encrypt.") },
    { icon: ICONS.gamepad, title: t("Game Hosting"), desc: t("Server game độ trễ thấp, bảng điều khiển riêng.") },
    { icon: ICONS.layers, title: t("Reseller & API"), desc: t("API đầy đủ và chương trình đại lý cho đối tác.") },
  ];
  return (
    <section id="products" style={sectionPad}>
      <div style={inner}>
        <Heading kicker={t("Sản phẩm")} title={t("Mọi thứ bạn cần cho hạ tầng số")} sub={t("Một nền tảng duy nhất cho toàn bộ vòng đời dịch vụ của bạn.")} t={t} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 44 }}>
          {items.map((it) => (
            <HoverCard key={it.title}>
              <div style={iconBox}>
                <Icon d={it.icon} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>{it.title}</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, marginTop: 8 }}>{it.desc}</p>
              <Link href="/register" style={learnMore}>
                {t("Tìm hiểu")} <Icon d={ICONS.arrow} size={14} />
              </Link>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
function Features({ t }: { t: (k: string) => string }) {
  const items = [
    { icon: ICONS.zap, title: t("Tốc độ cực nhanh"), desc: t("Ổ cứng NVMe SSD, LiteSpeed Web Server và hệ thống CDN tích hợp giúp website của bạn tải nhanh hơn bao giờ hết.") },
    { icon: ICONS.shield, title: t("Bảo mật cao cấp"), desc: t("Firewall chống DDoS, SSL miễn phí, backup tự động hàng ngày và hệ thống giám sát 24/7 bảo vệ dữ liệu của bạn.") },
    { icon: ICONS.headset, title: t("Hỗ trợ 24/7"), desc: t("Đội ngũ kỹ thuật giàu kinh nghiệm luôn sẵn sàng hỗ trợ bạn qua ticket, chat và email bất kể ngày đêm.") },
    { icon: ICONS.card, title: t("Giá cả hợp lý"), desc: t("Chất lượng dịch vụ premium nhưng giá cả bình dân. Cam kết không phát sinh chi phí ẩn, thanh toán minh bạch.") },
  ];
  return (
    <section id="features" style={{ ...sectionPad, background: "rgba(255,255,255,0.015)" }}>
      <div style={inner}>
        <Heading kicker={t("Vì sao chọn chúng tôi")} title={t("Được xây dựng để bạn tăng trưởng")} sub={t("Đầy đủ công cụ vận hành chuyên nghiệp, sẵn sàng ngay từ ngày đầu.")} t={t} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginTop: 44 }}>
          {items.map((it) => (
            <HoverCard key={it.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={iconBox}>
                  <Icon d={it.icon} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{it.title}</h3>
              </div>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, marginTop: 12 }}>{it.desc}</p>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks({ t }: { t: (k: string) => string }) {
  const steps = [
    { n: "01", title: t("Đăng ký"), desc: t("Tạo tài khoản miễn phí chỉ trong vài giây.") },
    { n: "02", title: t("Nạp tiền"), desc: t("Nạp ví qua VietQR/SePay, ghi nhận tức thì.") },
    { n: "03", title: t("Chọn dịch vụ"), desc: t("Chọn VPS, hosting, tên miền hay SSL phù hợp.") },
    { n: "04", title: t("Dùng ngay"), desc: t("Dịch vụ được khởi tạo tự động và sẵn sàng sử dụng.") },
  ];
  return (
    <section style={sectionPad}>
      <div style={inner}>
        <Heading kicker={t("Cách hoạt động")} title={t("Bắt đầu chỉ với 4 bước")} sub={t("Không cần hợp đồng, không chờ đợi — tất cả đều tự động.")} t={t} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18, marginTop: 44 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ ...card, position: "relative" }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  background: C.grad,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: 0.9,
                }}
              >
                {s.n}
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{s.title}</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING ---------------- */
function Pricing({ packages, t }: { packages: VpsPackage[]; t: (k: string) => string }) {
  return (
    <section id="pricing" style={{ ...sectionPad, background: "rgba(255,255,255,0.015)" }}>
      <div style={inner}>
        <Heading kicker={t("Bảng giá")} title={t("Giá minh bạch, không phí ẩn")} sub={t("Chọn gói VPS phù hợp, nâng cấp bất cứ lúc nào.")} t={t} />
        {packages.length === 0 ? (
          <div style={{ ...card, textAlign: "center", marginTop: 44, padding: 48 }}>
            <p style={{ color: C.muted, fontSize: 15 }}>{t("Bảng giá đang được cập nhật. Vui lòng liên hệ để nhận báo giá mới nhất.")}</p>
            <Link href="/contact" style={{ ...btnPrimary, marginTop: 18 }}>{t("Liên hệ")}</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 44, maxWidth: 980, marginInline: "auto" }}>
            {packages.map((p, i) => {
              const popular = packages.length >= 2 && i === 1;
              const specs = [
                { l: t("CPU"), v: `${p.cpu} ${t("vCPU")}` },
                { l: t("RAM"), v: `${p.ram} GB` },
                { l: t("Lưu trữ"), v: `${p.storage} GB` },
                { l: t("Băng thông"), v: `${p.bandwidth}` },
              ];
              return (
                <div
                  key={p.id}
                  style={{
                    ...card,
                    position: "relative",
                    border: popular ? `1px solid ${C.borderHover}` : `1px solid ${C.border}`,
                    background: popular ? "linear-gradient(135deg,rgba(79,124,255,0.1),rgba(124,58,237,0.06))" : C.card,
                    boxShadow: popular ? "0 12px 40px rgba(79,124,255,0.18)" : "none",
                  }}
                >
                  {popular ? (
                    <span
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: C.grad,
                        color: "white",
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("Phổ biến nhất")}
                    </span>
                  ) : null}
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                  {p.provider?.name ? <p style={{ color: C.faint, fontSize: 12.5, marginTop: 2 }}>{p.provider.name}</p> : null}
                  <div style={{ marginTop: 14, marginBottom: 18 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{formatCurrency(p.priceMonthly)}</span>
                    <span style={{ color: C.muted, fontSize: 14 }}>{t("/tháng")}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {specs.map((sp) => (
                      <div key={sp.l} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                        <span style={{ color: C.blue }}>
                          <Icon d={ICONS.check} size={16} />
                        </span>
                        <span style={{ color: C.muted }}>{sp.l}:</span>
                        <span style={{ fontWeight: 600 }}>{sp.v}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" style={{ ...(popular ? btnPrimary : btnGhost), width: "100%", justifyContent: "center", marginTop: 22 }}>
                    {t("Đăng ký ngay")}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials({ t }: { t: (k: string) => string }) {
  const items = [
    { name: t("Nguyễn Minh Tuấn"), role: t("Founder, Startup công nghệ"), quote: t("Khởi tạo VPS chỉ trong vài phút, thanh toán VietQR cực nhanh. Đúng thứ tôi cần để vận hành sản phẩm.") },
    { name: t("Trần Thu Hà"), role: t("Quản trị viên hệ thống"), quote: t("Quản lý tên miền và SSL ở cùng một nơi giúp tiết kiệm rất nhiều thời gian. Hỗ trợ phản hồi nhanh.") },
    { name: t("Lê Quốc Bảo"), role: t("Chủ studio game"), quote: t("Server game độ trễ thấp, ổn định. Bảng điều khiển dễ dùng, người chơi của tôi rất hài lòng.") },
  ];
  return (
    <section style={sectionPad}>
      <div style={inner}>
        <Heading kicker={t("Khách hàng nói gì")} title={t("Được tin dùng bởi cộng đồng")} sub={t("Hàng nghìn cá nhân và doanh nghiệp đang vận hành cùng chúng tôi.")} t={t} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 44 }}>
          {items.map((it) => (
            <div key={it.name} style={card}>
              <div style={{ display: "flex", gap: 4, color: "#fbbf24", marginBottom: 14 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ fill: "#fbbf24" }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                      <path d={ICONS.star} />
                    </svg>
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.text }}>&ldquo;{it.quote}&rdquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: C.grad,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  {it.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                  <div style={{ color: C.muted, fontSize: 12.5 }}>{it.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PAYMENT ROW ---------------- */
function PaymentRow({ t }: { t: (k: string) => string }) {
  const logos = ["SePay", "VietQR", "Stripe", "PayPal", "Visa", "Mastercard"];
  return (
    <section style={{ padding: "clamp(24px,4vw,40px) clamp(16px,4vw,48px)" }}>
      <div style={{ ...inner, textAlign: "center" }}>
        <p style={{ color: C.faint, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
          {t("Hỗ trợ các cổng thanh toán phổ biến")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {logos.map((l) => (
            <span
              key={l}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card,
                fontWeight: 700,
                fontSize: 14,
                color: C.muted,
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
export function FaqList({ items, t }: { items: { q: string; a: string }[]; t: (k: string) => string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 800, marginInline: "auto" }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ ...card, padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "18px 22px",
                background: "transparent",
                border: "none",
                color: C.text,
                fontSize: 15.5,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              {it.q}
              <span style={{ color: C.blue, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, fontSize: 22, lineHeight: 1 }}>+</span>
            </button>
            {isOpen ? (
              <div style={{ padding: "0 22px 20px", color: C.muted, fontSize: 14.5, lineHeight: 1.7 }}>{it.a}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Faq({ t }: { t: (k: string) => string }) {
  const items = [
    { q: t("Tôi thanh toán bằng cách nào?"), a: t("Bạn có thể nạp ví qua VietQR/SePay với ghi nhận tức thì, hoặc dùng thẻ Visa/Mastercard, Stripe và PayPal cho thanh toán quốc tế.") },
    { q: t("Có hoàn tiền không?"), a: t("Chúng tôi áp dụng chính sách hoàn tiền cho các dịch vụ đủ điều kiện trong thời gian quy định. Vui lòng xem chi tiết tại trang Điều khoản sử dụng.") },
    { q: t("Uptime được cam kết ra sao?"), a: t("Chúng tôi cam kết uptime cao với hạ tầng dự phòng tại nhiều data center và giám sát 24/7.") },
    { q: t("Tôi nhận được hỗ trợ như thế nào?"), a: t("Đội ngũ kỹ thuật hỗ trợ qua hệ thống ticket và live-chat 24/7, phản hồi nhanh cho mọi vấn đề kỹ thuật.") },
    { q: t("Có dùng thử không?"), a: t("Bạn có thể đăng ký tài khoản miễn phí, khám phá bảng điều khiển và chỉ trả tiền khi kích hoạt dịch vụ.") },
    { q: t("Dữ liệu của tôi có an toàn không?"), a: t("Mọi dữ liệu nhạy cảm được mã hoá AES-256, tài khoản được bảo vệ bằng 2FA và chống gian lận nhiều lớp.") },
  ];
  return (
    <section id="faq" style={{ ...sectionPad, background: "rgba(255,255,255,0.015)" }}>
      <div style={inner}>
        <Heading kicker={t("FAQ")} title={t("Câu hỏi thường gặp")} sub={t("Chưa tìm thấy câu trả lời? Hãy liên hệ với chúng tôi.")} t={t} />
        <div style={{ marginTop: 44 }}>
          <FaqList items={items} t={t} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA BAND ---------------- */
function CtaBand({ t }: { t: (k: string) => string }) {
  return (
    <section style={{ padding: "clamp(40px,6vw,72px) clamp(16px,4vw,48px)" }}>
      <div
        style={{
          ...inner,
          borderRadius: 28,
          padding: "clamp(40px,6vw,72px) clamp(24px,5vw,64px)",
          background: C.grad,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 20% 20%,rgba(255,255,255,0.18),transparent 40%),radial-gradient(circle at 80% 80%,rgba(255,255,255,0.12),transparent 40%)",
          }}
        />
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{t("Sẵn sàng bắt đầu?")}</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(15px,2vw,18px)", marginTop: 12, maxWidth: 520, marginInline: "auto" }}>
            {t("Tạo tài khoản miễn phí và triển khai dịch vụ đầu tiên của bạn ngay hôm nay.")}
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 28,
              padding: "14px 30px",
              borderRadius: 12,
              background: "white",
              color: "#0b1020",
              fontWeight: 800,
              fontSize: 15.5,
              textDecoration: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            {t("Đăng ký miễn phí")}
            <Icon d={ICONS.arrow} size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- shared bits ---------------- */
function Heading({ kicker, title, sub, t }: { kicker: string; title: string; sub: string; t: (k: string) => string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
      <span style={{ color: C.blue, fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{kicker}</span>
      <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 10, lineHeight: 1.15 }}>{title}</h2>
      <p style={{ color: C.muted, fontSize: "clamp(14px,2vw,16px)", marginTop: 12, lineHeight: 1.7 }}>{sub}</p>
    </div>
  );
}

function HoverCard({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        transform: hover ? "translateY(-4px)" : "none",
        borderColor: hover ? C.borderHover : C.border,
        boxShadow: hover ? "0 16px 40px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {children}
    </div>
  );
}

/* styles */
function glow(top: string, left: string, color: string, right?: string): React.CSSProperties {
  return {
    position: "absolute",
    top,
    left: right !== undefined ? "auto" : left,
    right: right,
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: color,
    filter: "blur(110px)",
    pointerEvents: "none",
  };
}

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 16px",
  borderRadius: 999,
  border: `1px solid ${C.border}`,
  background: C.card,
  fontSize: 13.5,
  fontWeight: 600,
  color: C.text,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 11,
  background: C.grad,
  color: "white",
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 6px 20px rgba(79,124,255,0.3)",
  whiteSpace: "nowrap",
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 11,
  background: "rgba(255,255,255,0.04)",
  color: C.text,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
  border: `1px solid ${C.border}`,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const iconBox: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,rgba(79,124,255,0.18),rgba(124,58,237,0.14))",
  border: `1px solid ${C.border}`,
  color: C.blue,
  flexShrink: 0,
};

const learnMore: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  marginTop: 16,
  color: C.blue,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: 999,
  border: `1px solid ${C.border}`,
  background: C.card,
  fontSize: 13,
  fontWeight: 600,
};
