"use client";
interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: string; up: boolean };
}
export default function StatCard({ title, value, sub, icon, color = "var(--accent)", trend }: StatCardProps) {
  return (
    <div className="animate-in" style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: "20px", cursor: "default",
      transition: "border-color 0.15s, transform 0.15s",
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500 }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {trend && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: trend.up ? "var(--green)" : "var(--red)", background: trend.up ? "var(--green-soft)" : "var(--red-soft)", padding: "2px 6px", borderRadius: 99 }}>
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}
