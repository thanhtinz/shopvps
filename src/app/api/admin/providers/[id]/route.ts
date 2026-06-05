import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, apiKey, apiEndpoint, isActive } = await req.json();
  const data: any = { name, apiEndpoint, isActive };
  if (apiKey && !apiKey.includes("•")) data.apiKey = encrypt(apiKey);
  const provider = await prisma.vpsProvider.update({ where: { id: params.id }, data });
  return NextResponse.json({ success: true, data: { ...provider, apiKey: "••••••••" } });
}
