import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/workers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subject, html, targetRole, targetStatus } = await req.json();
  if (!subject || !html) return NextResponse.json({ error: "Thiếu subject hoặc nội dung" }, { status: 400 });

  const where: any = {};
  if (targetRole) where.role = targetRole;
  if (targetStatus) where.status = targetStatus;

  const users = await prisma.user.findMany({ where, select: { email: true, name: true } });

  let sent = 0;
  for (const user of users) {
    if (user.email) {
      const personalised = html.replace(/\{\{name\}\}/g, user.name || "bạn");
      await queueEmail(user.email, subject, personalised);
      sent++;
    }
  }

  return NextResponse.json({ success: true, data: { queued: sent } });
}
