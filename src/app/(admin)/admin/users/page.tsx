"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustId, setAdjustId] = useState<string|null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");

  const loadUsers = useCallback(async (q = search) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${q}`).then(r=>r.json());
    setUsers(res.data?.users||[]); setTotal(res.data?.total||0); setLoading(false);
  }, [search]);

  useEffect(() => { loadUsers(); }, []);

  async function toggleUser(id: string) {
    await fetch("/api/admin/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:id, action:"toggle_status" }) });
    loadUsers();
  }

  async function adjustBalance(id: string) {
    const val = parseFloat(adjustAmount);
    if (isNaN(val)) return;
    await fetch("/api/admin/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:id, action:"adjust_balance", value:val }) });
    setAdjustId(null); setAdjustAmount(""); loadUsers();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Người dùng ({total})</h1>
        <div style={{ display:"flex", gap:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadUsers(search)} placeholder="Tìm tên, email..." style={{ padding:"8px 12px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-primary)", fontSize:13, outline:"none", width:220 }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          <button onClick={()=>loadUsers(search)} style={{ padding:"8px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, cursor:"pointer" }}>Tìm</button>
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:300, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Người dùng","Role","Số dư","Trạng thái","Ngày tạo","Thao tác"].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"white" }}>{u.name?.[0]||"?"}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{u.name||"—"}</div>
                        <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <Badge color={u.role==="SUPER_ADMIN"?"red":u.role==="ADMIN"?"yellow":"gray"}>
                      {u.role==="SUPER_ADMIN"?"Super Admin":u.role==="ADMIN"?"Admin":"User"}
                    </Badge>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    {adjustId === u.id ? (
                      <div style={{ display:"flex", gap:4 }}>
                        <input value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} placeholder="±100000" style={{ width:100, padding:"4px 8px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:6, color:"var(--text-primary)", fontSize:12, outline:"none" }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                        <button onClick={()=>adjustBalance(u.id)} style={{ padding:"4px 8px", background:"var(--green)", border:"none", borderRadius:6, color:"white", fontSize:11, cursor:"pointer" }}>&#10003;</button>
                        <button onClick={()=>setAdjustId(null)} style={{ padding:"4px 8px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:6, color:"var(--text-muted)", fontSize:11, cursor:"pointer" }}>&#10005;</button>
                      </div>
                    ) : (
                      <button onClick={()=>setAdjustId(u.id)} style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                        {formatCurrency(u.balance)}
                      </button>
                    )}
                  </td>
                  <td style={{ padding:"12px 16px" }}><Badge color={u.status==="ACTIVE"?"green":"red"}>{u.status==="ACTIVE"?"Hoạt động":"Bị khoá"}</Badge></td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>{formatDate(u.createdAt)}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <button onClick={()=>toggleUser(u.id)} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:u.status==="ACTIVE"?"var(--red)":"var(--green)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                      {u.status==="ACTIVE"?"Khoá":"Mở khoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
