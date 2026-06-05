"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getSocket } from "@/lib/socketClient";

const prioColor: Record<string,"green"|"yellow"|"red"|"blue"> = { LOW:"green", MEDIUM:"blue", HIGH:"yellow", URGENT:"red" };
const prioLabel: Record<string,string> = { LOW:"Thấp", MEDIUM:"Trung bình", HIGH:"Cao", URGENT:"Khẩn cấp" };
const statusColor: Record<string,"blue"|"yellow"|"gray"> = { OPEN:"blue", IN_PROGRESS:"yellow", CLOSED:"gray" };
const statusLabel: Record<string,string> = { OPEN:"Đang mở", IN_PROGRESS:"Đang xử lý", CLOSED:"Đã đóng" };

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(() => {
    fetch("/api/admin/tickets").then(r=>r.json()).then(d=>{ setTickets(d.data?.items||[]); setLoading(false); });
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Live updates per selected ticket + slow fallback poll.
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const load = async () => {
      const d = await fetch(`/api/admin/tickets/${selected.id}/messages`).then(r=>r.json()).catch(()=>null);
      if (!active || !d?.data) return;
      setMessages(prev => {
        const next = d.data as any[];
        if (prev.length === next.length && prev[prev.length-1]?.id === next[next.length-1]?.id) return prev;
        return next;
      });
    };
    load();
    const socket = getSocket();
    socket.emit("join", selected.id);
    const onUpdate = (p: any) => { if (p?.id === selected.id) { load(); loadTickets(); } };
    socket.on("ticket:update", onUpdate);
    const iv = setInterval(load, 15000);
    return () => { active = false; socket.emit("leave", selected.id); socket.off("ticket:update", onUpdate); clearInterval(iv); };
  }, [selected, loadTickets]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!reply.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/admin/tickets/${selected.id}/messages`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content: reply }) });
    const data = await res.json();
    if (data.success) { setMessages(p=>[...p, data.data]); setReply(""); loadTickets(); }
    setSending(false);
  }

  async function setStatus(action: "close" | "reopen") {
    await fetch(`/api/admin/tickets/${selected.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action }) });
    setSelected({ ...selected, status: action === "close" ? "CLOSED" : "OPEN" });
    loadTickets();
  }

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  const openCount = tickets.filter(t=>t.status!=="CLOSED").length;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Hỗ trợ — Ticket ({openCount} đang mở)</h1>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: selected?"340px 1fr":"1fr", gap:16, height:"calc(100vh - 160px)" }}>
        {/* List */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{tickets.length} tickets</div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {tickets.length === 0 && <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>Chưa có ticket nào</div>}
            {tickets.map(t => (
              <div key={t.id} onClick={()=>setSelected(t)} style={{
                padding:"13px 16px", borderBottom:"1px solid var(--border)", cursor:"pointer",
                background: selected?.id===t.id ? "var(--accent-soft)" : "transparent",
                borderLeft: selected?.id===t.id ? "3px solid var(--accent)" : "3px solid transparent",
              }}
                onMouseEnter={e=>{ if(selected?.id!==t.id)(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"; }}
                onMouseLeave={e=>{ if(selected?.id!==t.id)(e.currentTarget as HTMLElement).style.background="transparent"; }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5, gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:selected?.id===t.id?"var(--accent)":"var(--text-primary)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</span>
                  <Badge color={statusColor[t.status]||"gray"}>{statusLabel[t.status]||t.status}</Badge>
                </div>
                <div style={{ fontSize:11.5, color:"var(--text-muted)", marginBottom:5 }}>{t.user?.name||"—"} · {t.user?.email}{t.department?` · ${t.department}`:""}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <Badge color={prioColor[t.priority]||"gray"}>{prioLabel[t.priority]}</Badge>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>{formatDate(t.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        {selected && (
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{selected.subject}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Badge color={statusColor[selected.status]||"gray"}>{statusLabel[selected.status]}</Badge>
                  <Badge color={prioColor[selected.priority]||"gray"}>{prioLabel[selected.priority]}</Badge>
                  <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{selected.user?.email}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {selected.status !== "CLOSED" ? (
                  <button onClick={()=>setStatus("close")} style={{ padding:"7px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--red)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Đóng ticket</button>
                ) : (
                  <button onClick={()=>setStatus("reopen")} style={{ padding:"7px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--green)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Mở lại</button>
                )}
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display:"flex", gap:10, flexDirection: msg.isAdmin?"row-reverse":"row" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background: msg.isAdmin?"var(--accent-soft)":"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color: msg.isAdmin?"var(--accent)":"var(--text-secondary)", flexShrink:0 }}>
                    {msg.isAdmin ? "A" : (msg.user?.name?.[0] || "U")}
                  </div>
                  <div style={{ maxWidth:"70%" }}>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4, textAlign: msg.isAdmin?"right":"left" }}>
                      {msg.isAdmin?"Admin (bạn)":(msg.user?.name||"Khách")} · {formatDate(msg.createdAt)}
                    </div>
                    <div style={{ padding:"10px 14px", borderRadius: msg.isAdmin?"12px 4px 12px 12px":"4px 12px 12px 12px", background: msg.isAdmin?"var(--accent-soft)":"var(--bg-elevated)", border:`1px solid ${msg.isAdmin?"rgba(79,124,255,0.2)":"var(--border)"}`, fontSize:13.5, color:"var(--text-primary)", lineHeight:1.6 }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <div style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>Chưa có tin nhắn nào</div>}
              <div ref={bottomRef}/>
            </div>

            {selected.status !== "CLOSED" ? (
              <form onSubmit={send} style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
                <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Trả lời khách hàng..." style={{ flex:1, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" }}/>
                <button type="submit" disabled={sending||!reply.trim()} style={{ padding:"10px 18px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:reply.trim()?"pointer":"not-allowed", opacity:reply.trim()?1:0.5 }}>Gửi</button>
              </form>
            ) : (
              <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>Ticket đã đóng</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
