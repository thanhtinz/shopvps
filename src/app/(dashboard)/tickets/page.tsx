"use client";
import { useState, useEffect, useRef } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getSocket } from "@/lib/socketClient";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

const prioColor: Record<string,"green"|"yellow"|"red"|"blue"> = { LOW:"green", MEDIUM:"blue", HIGH:"yellow", URGENT:"red" };
const prioLabel: Record<string,string> = { LOW:"Thấp", MEDIUM:"Trung bình", HIGH:"Cao", URGENT:"Khẩn cấp" };
const statusColor: Record<string,"blue"|"yellow"|"gray"> = { OPEN:"blue", IN_PROGRESS:"yellow", CLOSED:"gray" };
const statusLabel: Record<string,string> = { OPEN:"Đang mở", IN_PROGRESS:"Đang xử lý", CLOSED:"Đã đóng" };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPrio, setNewPrio] = useState("MEDIUM");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tickets").then(r=>r.json()).then(d=>{ setTickets(d.data||[]); setLoading(false); });
  }, []);

  // Live updates: the server pushes a "ticket:update" signal over Socket.IO
  // when a message is added; we then refetch through the authorized REST
  // endpoint. State is only replaced when the thread actually changed, so the
  // auto-scroll effect doesn't fire on every refetch. A slow interval acts as
  // a fallback if the socket connection drops.
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const load = async () => {
      const d = await fetch(`/api/tickets/${selected.id}/messages`).then(r=>r.json()).catch(()=>null);
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
    const onUpdate = (p: any) => { if (p?.id === selected.id) load(); };
    socket.on("ticket:update", onUpdate);
    const iv = setInterval(load, 15000);
    return () => { active = false; socket.emit("leave", selected.id); socket.off("ticket:update", onUpdate); clearInterval(iv); };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault(); if (!newMsg.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${selected.id}/messages`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content: newMsg }) });
    const data = await res.json();
    if (data.success) { setMessages(p=>[...p, data.data]); setNewMsg(""); }
    setSending(false);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tickets", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ subject:newSubject, priority:newPrio, content:newContent }) });
    const data = await res.json();
    if (data.success) { setTickets(p=>[data.data,...p]); setShowNew(false); setNewSubject(""); setNewContent(""); setSelected(data.data); }
  }

  if (loading) return <div style={{ maxWidth:1000, margin:"0 auto" }}><div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/></div>;

  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:2 }}>Hỗ trợ</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{tickets.filter(t=>t.status!=="CLOSED").length} ticket đang mở</p>
        </div>
        <button onClick={()=>setShowNew(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <Icon d="M12 5v14 M5 12h14"/> Tạo ticket mới
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:selected?"320px 1fr":"1fr", gap:16, height:"calc(100vh - 180px)" }}>
        {/* Ticket list */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>
            {tickets.length} tickets
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {tickets.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)", fontSize:13 }}>
                <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                Chưa có ticket nào
              </div>
            )}
            {tickets.map(t => (
              <div key={t.id} onClick={()=>setSelected(t)} style={{
                padding:"14px 16px", borderBottom:"1px solid var(--border)", cursor:"pointer", transition:"background 0.12s",
                background: selected?.id===t.id ? "var(--accent-soft)" : "transparent",
                borderLeft: selected?.id===t.id ? "3px solid var(--accent)" : "3px solid transparent",
              }}
              onMouseEnter={e=>{ if(selected?.id!==t.id)(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"; }}
              onMouseLeave={e=>{ if(selected?.id!==t.id)(e.currentTarget as HTMLElement).style.background="transparent"; }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:selected?.id===t.id?"var(--accent)":"var(--text-primary)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:8 }}>{t.subject}</span>
                  <Badge color={statusColor[t.status]||"gray"}>{statusLabel[t.status]||t.status}</Badge>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <Badge color={prioColor[t.priority]||"gray"}>{prioLabel[t.priority]}</Badge>
                  <span style={{ fontSize:11, color:"var(--text-muted)" }}>{formatDate(t.updatedAt)}</span>
                </div>
                {t.messages?.[0] && (
                  <div style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {t.messages[0].content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {selected && (
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{selected.subject}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Badge color={statusColor[selected.status]||"gray"}>{statusLabel[selected.status]}</Badge>
                  <Badge color={prioColor[selected.priority]||"gray"}>{prioLabel[selected.priority]}</Badge>
                  {selected.status !== "CLOSED" && (
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-muted)" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", animation:"pulse 1.8s infinite" }}/>
                      Trực tuyến
                    </span>
                  )}
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:4 }}>
                <Icon d="M6 18L18 6 M6 6l12 12"/>
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display:"flex", gap:10, flexDirection: msg.isAdmin?"row":"row-reverse" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background: msg.isAdmin?"var(--accent-soft)":"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color: msg.isAdmin?"var(--accent)":"var(--text-secondary)", flexShrink:0 }}>
                    {msg.isAdmin ? "A" : (msg.user?.name?.[0] || "U")}
                  </div>
                  <div style={{ maxWidth:"70%" }}>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4, textAlign: msg.isAdmin?"left":"right" }}>
                      {msg.isAdmin?"Admin":"Bạn"} · {formatDate(msg.createdAt)}
                    </div>
                    <div style={{
                      padding:"10px 14px", borderRadius: msg.isAdmin?"4px 12px 12px 12px":"12px 4px 12px 12px",
                      background: msg.isAdmin?"var(--bg-elevated)":"var(--accent-soft)",
                      border: `1px solid ${msg.isAdmin?"var(--border)":"rgba(79,124,255,0.2)"}`,
                      fontSize:13.5, color:"var(--text-primary)", lineHeight:1.6,
                    }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)", fontSize:13 }}>Chưa có tin nhắn nào</div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            {selected.status !== "CLOSED" ? (
              <form onSubmit={sendMessage} style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
                <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex:1, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <button type="submit" disabled={sending||!newMsg.trim()} style={{ padding:"10px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", cursor:newMsg.trim()?"pointer":"not-allowed", opacity:newMsg.trim()?1:0.5 }}>
                  <Icon d="M22 2L11 13 M22 2L15 22 11 13 2 9z"/>
                </button>
              </form>
            ) : (
              <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>Ticket đã đóng</div>
            )}
          </div>
        )}
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowNew(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:480, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Tạo ticket mới</h3>
            <form onSubmit={createTicket}>
              {[{ label:"Tiêu đề", val:newSubject, set:setNewSubject, ph:"Mô tả vấn đề ngắn gọn..." }].map(f=>(
                <div key={f.label} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{f.label}</label>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} required style={{ width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" }}
                    onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Mức độ ưu tiên</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["LOW","MEDIUM","HIGH","URGENT"].map(p=>(
                    <button key={p} type="button" onClick={()=>setNewPrio(p)} style={{ flex:1, padding:"8px 4px", borderRadius:"var(--radius-md)", border:"1.5px solid "+(newPrio===p?"var(--accent)":"var(--border)"), background:newPrio===p?"var(--accent-soft)":"var(--bg-surface)", color:newPrio===p?"var(--accent)":"var(--text-secondary)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      {prioLabel[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Nội dung</label>
                <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="Mô tả chi tiết vấn đề..." required rows={4} style={{ width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", resize:"vertical", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowNew(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button type="submit" style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer", fontSize:13 }}>Tạo ticket →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
