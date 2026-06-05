export type Appearance = {
  theme: "dark" | "light";
  accent: string;
  fontScale: number;
  dir: "ltr" | "rtl";
  font: string;
};

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "dark",
  accent: "#4f7cff",
  fontScale: 1,
  dir: "ltr",
  font: "'Plus Jakarta Sans', system-ui, sans-serif",
};

export const ACCENT_PRESETS = ["#4f7cff", "#22c55e", "#a78bfa", "#f59e0b", "#ef4444", "#22d3ee", "#ec4899"];
export const FONT_PRESETS = [
  { label: "Mặc định (Jakarta)", value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: "Hệ thống", value: "system-ui, -apple-system, sans-serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
];

const KEY = "appearance";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(79,124,255,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function loadAppearance(): Appearance {
  try {
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(a: Appearance) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}
}

export function applyAppearance(a: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", a.theme);
  root.setAttribute("dir", a.dir);
  root.style.setProperty("--accent", a.accent);
  root.style.setProperty("--accent-soft", hexToRgba(a.accent, 0.12));
  root.style.setProperty("--accent-glow", hexToRgba(a.accent, 0.25));
  root.style.setProperty("--border-focus", hexToRgba(a.accent, 0.5));
  root.style.setProperty("--font-scale", String(a.fontScale));
  root.style.setProperty("--font-sans", a.font);
}

// Inline, dependency-free script run in <head> before paint to avoid a flash
// of the default theme.
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var a=JSON.parse(localStorage.getItem("appearance")||"{}");var r=document.documentElement;r.setAttribute("data-theme",a.theme||"dark");if(a.dir)r.setAttribute("dir",a.dir);if(a.accent)r.style.setProperty("--accent",a.accent);if(a.fontScale)r.style.setProperty("--font-scale",a.fontScale);if(a.font)r.style.setProperty("--font-sans",a.font);}catch(e){}})();`;
