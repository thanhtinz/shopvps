import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/email-templates";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Seed any missing default templates so the admin can edit them.
  const existing = await prisma.emailTemplate.findMany({ select: { key: true } });
  const have = new Set(existing.map((t) => t.key));
  const missing = DEFAULT_TEMPLATES.filter((t) => !have.has(t.key));
  if (missing.length) await prisma.emailTemplate.createMany({ data: missing });

  const items = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: items });
}
