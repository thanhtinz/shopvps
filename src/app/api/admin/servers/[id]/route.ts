import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import axios from "axios";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.hostingServer.update({ where: { id: (await params).id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}

// Test WHM connection
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { action } = await req.json();

  if (action === "test") {
    const server = await prisma.hostingServer.findUnique({ where: { id: (await params).id } });
    if (!server) return NextResponse.json({ error: "Server không tồn tại" }, { status: 404 });
    try {
      const token = decrypt(server.whmToken);
      const res = await axios.get(`https://${server.whmHost}:${server.whmPort}/json-api/version`, {
        headers: { Authorization: `whm ${server.whmUser}:${token}` },
        timeout: 8000,
      });
      return NextResponse.json({ success: true, data: { version: res.data?.version || "OK" } });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: "Kết nối thất bại: " + err.message });
    }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
