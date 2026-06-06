import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientConfig, clientResources, clientPower, clientCommand, clientWebsocket } from "@/lib/pterodactyl";
import { getServerT } from "@/lib/i18n/server";

// Embedded game-panel proxy: relays a customer's own game server to the
// Pterodactyl Client API using the service account's client key. Ownership is
// enforced against the ProductOrder; non game-server orders are rejected.
async function resolve(id: string, userId: string) {
  const order = await prisma.productOrder.findFirst({ where: { id, userId } });
  if (!order) return { error: "Not found" as const, status: 404 };
  const data = (order.data as any) || {};
  if (!data.panelIdentifier) return { error: "No panel" as const, status: 400 };
  const cfg = await getClientConfig();
  if (!cfg) return { error: "Panel not configured" as const, status: 503 };
  return { identifier: data.panelIdentifier as string, cfg };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const action = new URL(req.url).searchParams.get("action") || "resources";
  try {
    if (action === "websocket") return NextResponse.json({ success: true, data: await clientWebsocket(r.cfg, r.identifier) });
    return NextResponse.json({ success: true, data: await clientResources(r.cfg, r.identifier) });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Panel error" }, { status: 502 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await resolve((await params).id, session.user.id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const b = await req.json();
  try {
    if (b.action === "power" && ["start", "stop", "restart", "kill"].includes(b.signal)) {
      await clientPower(r.cfg, r.identifier, b.signal);
      return NextResponse.json({ success: true });
    }
    if (b.action === "command" && typeof b.command === "string" && b.command.trim()) {
      await clientCommand(r.cfg, r.identifier, b.command.trim());
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Panel error" }, { status: 502 }); }
}
