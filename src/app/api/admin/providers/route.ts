import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any): Promise<boolean> { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any)?.role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const providers = await prisma.vpsProvider.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: providers.map((p: any) => ({ ...p, apiKey: p.apiKey ? "••••••••" : null })) });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, slug, apiKey, apiEndpoint } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const provider = await prisma.vpsProvider.create({
    data: { name, slug, apiKey: apiKey ? encrypt(apiKey) : null, apiEndpoint },
  });
  return NextResponse.json({ success: true, data: { ...provider, apiKey: "••••••••" } });
}
