"use client";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{children}</h2>
      {action}
    </div>
  );
}

export default function DashboardClient({ data, userName }: { data: any; userName: string }) {
  const { t } = useLocale();
  const txTypeColor: Record<string, "green" | "red" | "blue" | "yellow"> = {
    DEPOSIT: "green", WITHDRAWAL: "red", PURCHASE: "yellow",
    REFUND: "blue", BONUS: "green", COMMISSION: "blue",
  };
  const txTypeLabel: Record<string, string> = {
    DEPOSIT: t("Nạp tiền"), WITHDRAWAL: t("Rút tiền"), PURCHASE: t("Thanh toán"),
    REFUND: t("Hoàn tiền"), BONUS: t("Thưởng"), COMMISSION: t("Hoa hồng"),
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 860px) {
          .dash-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .dash-quick-actions { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <AnnouncementBanner />

      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
          {t("Chào")} {userName}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
          {t("Tổng quan hệ thống của bạn hôm nay")}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard
          title={t("Số dư ví")}
          value={formatCurrency(data.user?.balance || 0)}
          sub={t("Khả dụng")}
          trend={{ value: t("Ví hoa hồng:") + " " + formatCurrency(data.user?.affiliateBalance || 0), up: true }}
          color="var(--accent)"
          icon={<Icon d="M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6" />}
        />
        <StatCard
          title={t("VPS đang hoạt động")}
          value={String(data.vpsCount)}
          sub={t("máy chủ")}
          color="var(--cyan)"
          icon={<Icon d="M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7 M2 19h20 M5 19v-4 M19 19v-4" />}
        />
        <StatCard
          title={t("Hosting đang hoạt động")}
          value={String(data.hostingCount)}
          sub={t("gói hosting")}
          color="var(--purple)"
          icon={<Icon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />}
        />
        <StatCard
          title={t("Ticket chưa xử lý")}
          value={String(data.openTickets)}
          sub={t("ticket")}
          color={data.openTickets > 0 ? "var(--yellow)" : "var(--green)"}
          icon={<Icon d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}
        />
      </div>

      {/* Main grid */}
      <div className="dash-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>

        {/* Left: Quick actions + Transactions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Quick actions */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <SectionTitle>{t("Thao tác nhanh")}</SectionTitle>
            <div className="dash-quick-actions" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { href: "/vps", label: t("Mua VPS"), icon: "M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7 M2 19h20 M5 19v-4 M19 19v-4", color: "var(--cyan)" },
                { href: "/hosting", label: t("Mua Hosting"), icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16", color: "var(--purple)" },
                { href: "/wallet", label: t("Nạp tiền"), icon: "M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6", color: "var(--green)" },
                { href: "/tickets", label: t("Tạo ticket"), icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "var(--yellow)" },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "16px 8px",
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.color; (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>
                    <Icon d={a.icon} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <SectionTitle
              action={<Link href="/wallet" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>{t("Xem tất cả")} →</Link>}
            >{t("Giao dịch gần đây")}</SectionTitle>

            {data.recentTx.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
                {t("Chưa có giao dịch nào")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.recentTx.map((tx: any) => (
                  <div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: "var(--radius-md)",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: tx.amount > 0 ? "var(--green-soft)" : "var(--red-soft)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: tx.amount > 0 ? "var(--green)" : "var(--red)",
                      fontSize: 16, fontWeight: 700,
                    }}>
                      {tx.type === "DEPOSIT" ? "↓" : tx.type === "PURCHASE" ? "↑" : "↕"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {txTypeLabel[tx.type] || tx.type}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: ["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type) ? "var(--green)" : "var(--red)" }}>
                        {["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type) ? "+" : "-"}
                        {formatCurrency(Math.abs(Number(tx.amount)))}
                      </div>
                      <Badge color={txTypeColor[tx.type] || "gray"}>{txTypeLabel[tx.type]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: VPS status + info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* VPS summary */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <SectionTitle action={<Link href="/vps" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>{t("Quản lý")} →</Link>}>
              {t("Dịch vụ của bạn")}
            </SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: t("VPS đang chạy"), value: data.vpsCount, icon: "M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7 M2 19h20", color: "var(--cyan)" },
                { label: t("Hosting active"), value: data.hostingCount, icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z", color: "var(--purple)" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                    <Icon d={item.icon} size={14} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet summary */}
          <div style={{ background: "linear-gradient(135deg, rgba(79,124,255,0.12), rgba(124,58,237,0.08))", border: "1px solid rgba(79,124,255,0.2)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{t("Số dư hiện tại")}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
              {formatCurrency(data.user?.balance || 0)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              {t("Ví hoa hồng:")} {formatCurrency(data.user?.affiliateBalance || 0)}
            </div>
            <Link href="/wallet" style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: "var(--accent)", borderRadius: "var(--radius-md)",
              color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              <Icon d="M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6" size={14} />
              {t("Nạp tiền")}
            </Link>
          </div>

          {/* License status */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--green-soft)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", animation: "pulse-ring 2s infinite" }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--green)" }}>{t("License hợp lệ")}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("Hệ thống hoạt động bình thường")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
