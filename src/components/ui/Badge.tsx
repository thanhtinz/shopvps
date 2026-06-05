interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "red" | "yellow" | "blue" | "purple" | "gray" | "cyan";
}
const colorMap: Record<string, [string, string]> = {
  green:  ["var(--green)", "var(--green-soft)"],
  red:    ["var(--red)", "var(--red-soft)"],
  yellow: ["var(--yellow)", "var(--yellow-soft)"],
  blue:   ["var(--accent)", "var(--accent-soft)"],
  purple: ["var(--purple)", "var(--purple-soft)"],
  cyan:   ["var(--cyan)", "var(--cyan-soft)"],
  gray:   ["var(--text-secondary)", "var(--bg-hover)"],
};
export default function Badge({ children, color = "gray" }: BadgeProps) {
  const [fg, bg] = colorMap[color] || colorMap.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, color: fg, background: bg, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: fg, flexShrink: 0 }} />
      {children}
    </span>
  );
}
