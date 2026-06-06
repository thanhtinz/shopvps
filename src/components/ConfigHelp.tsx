"use client";
import { useLocale } from "@/components/LocaleProvider";

// Reusable inline guidance block for admin config pages: a short help paragraph
// plus optional external documentation links (where to obtain API keys, etc.).
export default function ConfigHelp({ help, docs }: { help?: string; docs?: { label: string; url: string }[] }) {
  const { t } = useLocale();
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4 M12 8h.01" /></svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {help && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{t(help)}</p>}
        {docs && docs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: help ? 10 : 0 }}>
            {docs.map((d) => (
              <a key={d.url} href={d.url} target={/^https?:\/\//.test(d.url) ? "_blank" : undefined} rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--accent)", textDecoration: "none", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 99, padding: "4px 11px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3" /></svg>
                {t(d.label)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
