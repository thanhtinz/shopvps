import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const data: any = {};
  for (const k of ["name", "subject", "body", "isActive"]) if (k in b) data[k] = b[k];
  const item = await prisma.emailTemplate.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: item });
}
