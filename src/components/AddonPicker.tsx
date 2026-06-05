"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

// Reusable add-on selector for the VPS/Hosting order pages. Reports the selected
// ids and their combined MONTHLY price; the parent multiplies by the cycle.
export default function AddonPicker({ scope, selected, onChange }: { scope: "vps" | "hosting"; selected: string[]; onChange: (ids: string[], monthlyTotal: number) => void }) {
  const [addons, setAddons] = useState<any[]>([]);

  useEffect(() => { fetch(`/api/addons?scope=${scope}`).then(r => r.json()).then(d => setAddons(d.data || [])).catch(() => {}); }, [scope]);

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    const monthly = addons.filter((a) => next.includes(a.id)).reduce((s, a) => s + Number(a.priceMonthly), 0);
    onChange(next, monthly);
  }

  if (addons.length === 0) return null;

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Tuỳ chọn thêm (add-on)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {addons.map((a) => {
          const on = selected.includes(a.id);
          return (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--accent-soft)" : "transparent" }}>
              <input type="checkbox" checked={on} onChange={() => toggle(a.id)} />
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{a.name}</span>
                {a.description && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)" }}>{a.description}</span>}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>+{formatCurrency(Number(a.priceMonthly))}/th</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
