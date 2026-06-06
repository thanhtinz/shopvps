import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegistrar } from "@/lib/registrars";
import { getServerT } from "@/lib/i18n/server";

// DNS manager for a customer's own domain (registrar-hosted zone).
async function resolve(id: string, userId: string) {
  const domain = await prisma.domainOrder.findFirst({ where: { id, userId } });
  if (!domain) return { error: "Not found" as const, status: 404 };
  if (domain.status !== "ACTIVE") return { error: "Inactive" as const, status: 400 };
  const reg = await getRegistrar();
  if (!reg || !reg.listDns) return { error: "DNS not available" as const, status: 503 };
  return { domain: domain.domain, reg };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  try { return NextResponse.json({ success: true, data: await r.reg.listDns!(r.domain) }); }
  catch (e: any) { return NextResponse.json({ error: e.message || "DNS error" }, { status: 502 }); }
}

const TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"];
function parseRec(b: any, t: (s: string) => string) {
  if (!TYPES.includes(b.type) || !b.value) return null;
  return { type: String(b.type), host: String(b.host || "").trim(), value: String(b.value).trim(), ttl: parseInt(b.ttl, 10) || 3600, priority: b.priority != null ? parseInt(b.priority, 10) : undefined };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const b = await req.json();
  const rec = parseRec(b, t);
  if (!rec || !r.reg.addDns) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  try { const res = await r.reg.addDns(r.domain, rec); return res.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: res.message || "DNS error" }, { status: 502 }); }
  catch (e: any) { return NextResponse.json({ error: e.message || "DNS error" }, { status: 502 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const b = await req.json();
  const rec = parseRec(b, t);
  if (!b.recordId || !rec || !r.reg.updateDns) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  try { const res = await r.reg.updateDns(r.domain, String(b.recordId), rec); return res.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: res.message || "DNS error" }, { status: 502 }); }
  catch (e: any) { return NextResponse.json({ error: e.message || "DNS error" }, { status: 502 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const recordId = new URL(req.url).searchParams.get("recordId");
  if (!recordId || !r.reg.deleteDns) return NextResponse.json({ error: "Missing recordId" }, { status: 400 });
  try { const res = await r.reg.deleteDns(r.domain, recordId); return res.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: res.message || "DNS error" }, { status: 502 }); }
  catch (e: any) { return NextResponse.json({ error: e.message || "DNS error" }, { status: 502 }); }
}
