import React from "react";
import Link from "next/link";

export default function LandingPage() {
    const featureIcons: Record<string, React.ReactNode> = {
    vps: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4"/></svg>,
    hosting: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
    payment: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6M16 16h6M19 13v6"/></svg>,
    security: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/></svg>,
    team: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    affiliate: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  };
  const features = [
    { iconKey: "vps", title: "VPS Management", desc: "Vultr, Hetzner, DigitalOcean, Linode, OVH — quản lý từ một nơi" },
    { iconKey: "hosting", title: "Hosting & cPanel", desc: "Tích hợp WHM API, SSO cPanel, tự động tạo tài khoản" },
    { iconKey: "payment", title: "Thanh toán VN", desc: "Nạp tiền tự động qua SePay, VietQR, MB Bank, ACB..." },
    { iconKey: "security", title: "Bảo mật cao", desc: "2FA TOTP, mã hoá AES-256, CSRF protection, bcrypt" },
    { iconKey: "team", title: "Team & Phân quyền", desc: "Mời thành viên, phân quyền chi tiết từng VPS/Hosting" },
    { iconKey: "affiliate", title: "Affiliate System", desc: "Hoa hồng tự động, link giới thiệu, dashboard thống kê" },
  ];

  const plans = [
    { name: "Starter", price: "49K", period: "/tháng", features: ["1 vCPU", "1 GB RAM", "25 GB SSD", "1 TB Bandwidth"], color: "#4f7cff" },
    { name: "Pro", price: "179K", period: "/tháng", features: ["2 vCPU", "4 GB RAM", "80 GB SSD", "4 TB Bandwidth"], color: "#7c3aed", popular: true },
    { name: "Business", price: "399K", period: "/tháng", features: ["4 vCPU", "8 GB RAM", "160 GB SSD", "8 TB Bandwidth"], color: "#059669" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", color: "#e8edf5", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>ShopVPS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/status" style={{ padding: "8px 14px", borderRadius: 8, color: "#8896aa", textDecoration: "none", fontSize: 14 }}>Status</Link>
          <Link href="/login" style={{ padding: "8px 14px", borderRadius: 8, color: "#e8edf5", textDecoration: "none", fontSize: 14 }}>Đăng nhập</Link>
          <Link href="/register" style={{ padding: "9px 18px", borderRadius: 8, background: "#4f7cff", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Đăng ký miễn phí</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "96px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(79,124,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,124,255,0.04) 1px,transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 100%)" }} />
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,rgba(79,124,255,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "rgba(79,124,255,0.1)", border: "1px solid rgba(79,124,255,0.25)", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f7cff", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>Platform quản lý VPS & Hosting chuyên nghiệp</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20, maxWidth: 800, margin: "0 auto 20px" }}>
            Quản lý toàn bộ hạ tầng<br />
            <span style={{ background: "linear-gradient(135deg,#4f7cff,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>từ một nơi duy nhất</span>
          </h1>
          <p style={{ fontSize: 18, color: "#8896aa", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            VPS, Hosting, thanh toán tự động, team phân quyền — tất cả trong một platform dành riêng cho thị trường Việt Nam.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ padding: "14px 32px", borderRadius: 10, background: "#4f7cff", color: "white", textDecoration: "none", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              Bắt đầu miễn phí →
            </Link>
            <Link href="/status" style={{ padding: "14px 24px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8edf5", textDecoration: "none", fontSize: 15 }}>
              Xem Status Page
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>Tính năng đầy đủ, sẵn sàng production</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,124,255,0.3)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{featureIcons[f.iconKey as keyof typeof featureIcons]}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#8896aa", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "64px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>Giá VPS cạnh tranh</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{
              background: "rgba(13,17,23,0.8)", border: `1px solid ${plan.popular ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 20, padding: "28px", position: "relative",
              transform: plan.popular ? "scale(1.02)" : "none",
            }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#7c3aed", borderRadius: 99, padding: "3px 16px", fontSize: 11.5, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>Phổ biến nhất</div>}
              <div style={{ fontSize: 15, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.04em" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: "#8896aa" }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#8896aa" }}>
                    <span style={{ color: plan.color, fontWeight: 700 }}>&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/register" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 10, background: plan.popular ? plan.color : "rgba(255,255,255,0.06)", border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                Đăng ký ngay
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>ShopVPS</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[{ label: "Status", href: "/status" }, { label: "Đăng nhập", href: "/login" }, { label: "Đăng ký", href: "/register" }].map(l => (
            <Link key={l.href} href={l.href} style={{ color: "#4a5568", textDecoration: "none", fontSize: 13 }}>{l.label}</Link>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#4a5568" }}>© 2026 ShopVPS. Built with Next.js</span>
      </footer>
    </div>
  );
}
