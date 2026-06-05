import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const servers = await prisma.hostingServer.findMany({ orderBy: { createdAt: "desc" } });
  // Mask WHM token
  const masked = servers.map((s: any) => ({ ...s, whmToken: "••••••••" }));
  return NextResponse.json({ success: true, data: masked });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, hostname, whmHost, whmPort, whmUser, whmToken, maxAccounts } = await req.json();
  if (!name || !whmHost || !whmUser || !whmToken) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const server = await prisma.hostingServer.create({
    data: { name, hostname: hostname || whmHost, whmHost, whmPort: whmPort || 2087, whmUser, whmToken: encrypt(whmToken), maxAccounts: maxAccounts || 100 },
  });
  return NextResponse.json({ success: true, data: { ...server, whmToken: "••••••••" } });
}
