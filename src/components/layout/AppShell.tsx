"use client";
import { useState } from "react";

// Shared responsive shell: the sidebar is in-flow on desktop and an off-canvas
// drawer (with overlay + hamburger) on small screens.
export default function AppShell({
  sidebar,
  header,
  padding = 24,
  children,
}: {
  sidebar: (close: () => void) => React.ReactNode;
  header?: React.ReactNode;
  padding?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div className={`app-sidebar${open ? " open" : ""}`}>{sidebar(close)}</div>
      {open && <div className="app-overlay" onClick={close} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div className="app-topbar">
          <button className="app-hamburger" onClick={() => setOpen(true)} aria-label="Mở menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          {header && <div style={{ flex: 1, minWidth: 0 }}>{header}</div>}
        </div>
        <main className="app-main" style={{ flex: 1, overflowY: "auto", padding }}>{children}</main>
      </div>
    </div>
  );
}
