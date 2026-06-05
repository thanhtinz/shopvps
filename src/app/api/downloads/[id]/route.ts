import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Increment the counter and return the file URL for the client to open.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const dl = await prisma.download.findFirst({ where: { id, isActive: true } });
  if (!dl) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  await prisma.download.update({ where: { id }, data: { count: { increment: 1 } } });
  return NextResponse.json({ success: true, data: { url: dl.url } });
}
