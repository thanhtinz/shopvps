import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await prisma.setting.findMany();
  const obj = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
  return NextResponse.json({ success: true, data: obj });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await req.json();
  await Promise.all(Object.entries(settings).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
  ));
  return NextResponse.json({ success: true });
}
