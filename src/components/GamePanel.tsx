"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

// Embedded game control panel: connects straight to the Pterodactyl node
// websocket (token brokered by our server) for a live console + stats, and
// sends power signals / commands — the same protocol the real panel uses.

const stripAnsi = (s: string) => s.replace(/\[[0-9;]*m/g, "");
const fmtBytes = (b: number) => b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GiB` : `${(b / 1048576).toFixed(0)} MiB`;

const STATE_LABEL: Record<string, string> = { running: "running", starting: "starting", stopping: "stopping", offline: "offline" };

export default function GamePanel({ orderId, panelUrl }: { orderId: string; panelUrl?: string | null }) {
  const { t } = useLocale();
  const [lines, setLines] = useState<string[]>([]);
  const [state, setState] = useState<string>("");
  const [stats, setStats] = useState<{ cpu: number; mem: number; disk: number } | null>(null);
  const [connected, setConnected] = useState(false);
  const [cmd, setCmd] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const closedRef = useRef(false);

  const push = useCallback((raw: string) => {
    setLines((prev) => [...prev.slice(-280), ...stripAnsi(raw).split("\n")]);
  }, []);

  const authenticate = useCallback(async (ws: WebSocket) => {
    const res = await fetch(`/api/products/orders/${orderId}/panel?action=websocket`).then((r) => r.json()).catch(() => null);
    if (res?.data?.token) ws.send(JSON.stringify({ event: "auth", args: [res.data.token] }));
  }, [orderId]);

  const connect = useCallback(async () => {
    const res = await fetch(`/api/products/orders/${orderId}/panel?action=websocket`).then((r) => r.json()).catch(() => null);
    if (!res?.data?.socket) { push("[panel] " + t("Không thể kết nối bảng điều khiển")); return; }
    const ws = new WebSocket(res.data.socket);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ event: "auth", args: [res.data.token] }));
    ws.onmessage = (ev) => {
      let msg: any; try { msg = JSON.parse(ev.data); } catch { return; }
      const { event, args } = msg;
      if (event === "auth success") {
        setConnected(true);
        ws.send(JSON.stringify({ event: "send logs", args: [null] }));
        ws.send(JSON.stringify({ event: "send stats", args: [null] }));
      } else if (event === "console output" || event === "install output") {
        push(args?.[0] ?? "");
      } else if (event === "status") {
        setState(args?.[0] ?? "");
      } else if (event === "stats") {
        try { const s = JSON.parse(args?.[0] || "{}"); setState(s.state || ""); setStats({ cpu: s.cpu_absolute || 0, mem: s.memory_bytes || 0, disk: s.disk_bytes || 0 }); } catch {}
      } else if (event === "token expiring" || event === "token expired" || event === "jwt error") {
        authenticate(ws);
      }
    };
    ws.onclose = () => { setConnected(false); if (!closedRef.current) setTimeout(connect, 3000); };
    ws.onerror = () => ws.close();
  }, [orderId, push, authenticate, t]);

  useEffect(() => {
    closedRef.current = false;
    connect();
    return () => { closedRef.current = true; wsRef.current?.close(); };
  }, [connect]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [lines]);

  function power(signal: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ event: "set state", args: [signal] }));
    else fetch(`/api/products/orders/${orderId}/panel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "power", signal }) });
  }
  function sendCmd(e: React.FormEvent) {
    e.preventDefault();
    const c = cmd.trim(); if (!c) return;
    push("> " + c);
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ event: "send command", args: [c] }));
    else fetch(`/api/products/orders/${orderId}/panel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "command", command: c }) });
    setCmd("");
  }

  const running = state === "running";
  const dot = running ? "var(--green)" : state === "starting" || state === "stopping" ? "var(--yellow)" : "var(--text-muted)";
  const pBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, display: "inline-block" }} />
          {t("Bảng điều khiển")} {state && <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {STATE_LABEL[state] || state}</span>}
          {!connected && <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 12 }}>· {t("đang kết nối...")}</span>}
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => power("start")} disabled={running} style={{ ...pBtn, background: running ? "var(--bg-elevated)" : "var(--green)", opacity: running ? 0.5 : 1 }}>{t("Bắt đầu")}</button>
          <button onClick={() => power("restart")} style={{ ...pBtn, background: "var(--accent)" }}>{t("Khởi động lại")}</button>
          <button onClick={() => power("stop")} disabled={!running && state !== "starting"} style={{ ...pBtn, background: "var(--red)", opacity: !running && state !== "starting" ? 0.5 : 1 }}>{t("Dừng")}</button>
          {panelUrl && <a href={panelUrl} target="_blank" rel="noopener noreferrer" style={{ ...pBtn, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", textDecoration: "none" }}>{t("Mở panel đầy đủ")}</a>}
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
          {[{ l: t("CPU"), v: `${stats.cpu.toFixed(1)}%` }, { l: t("Bộ nhớ"), v: fmtBytes(stats.mem) }, { l: t("Ổ đĩa"), v: fmtBytes(stats.disk) }].map((s) => (
            <div key={s.l} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div ref={logRef} style={{ background: "#0a0e14", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", height: 320, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.55, color: "#c5d1de", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {lines.length === 0 ? <span style={{ color: "var(--text-muted)" }}>{t("Đang chờ nhật ký máy chủ...")}</span> : lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <form onSubmit={sendCmd} style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder={t("Nhập một lệnh...")} style={{ flex: 1, boxSizing: "border-box", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-mono)" }} />
        <button type="submit" style={{ ...pBtn, background: "var(--accent)" }}>{t("Gửi")}</button>
      </form>
    </div>
  );
}
