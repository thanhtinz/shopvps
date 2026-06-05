export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "var(--font-sans)",
      position: "relative", overflow: "hidden",
    }}>
      {/* grid bg */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(79,124,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(79,124,255,0.05) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%,black 40%,transparent 100%)",
      }}/>
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 500, height: 200, background: "radial-gradient(ellipse,rgba(79,124,255,0.12) 0%,transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>{children}</div>
    </div>
  );
}
