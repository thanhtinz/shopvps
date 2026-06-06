import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidCron } from "@/lib/cron";
import { getServerT } from "@/lib/i18n/server";

async function ownsJob(userId: string, orderId: string, cronId: string) {
  const job = await prisma.cronjob.findFirst({ where: { id: cronId, orderId }, include: { order: { select: { userId: true } } } });
  return job && job.order.userId === userId ? job : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; cronId: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, cronId } = await params;
  if (!await ownsJob(session.user.id, id, cronId)) return NextResponse.json({ error: t("Không tìm thấy") }, { status: 404 });
  const body = await req.json();
  const data: any = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.name) data.name = String(body.name).slice(0, 120);
  if (body.url) { if (!/^https?:\/\//i.test(body.url)) return NextResponse.json({ error: t("URL không hợp lệ") }, { status: 400 }); data.url = String(body.url); }
  if (body.method) data.method = ["GET", "POST", "HEAD"].includes(body.method) ? body.method : "GET";
  if (body.schedule) { if (!isValidCron(body.schedule)) return NextResponse.json({ error: t("Biểu thức cron không hợp lệ") }, { status: 400 }); data.schedule = String(body.schedule).trim(); }
  const job = await prisma.cronjob.update({ where: { id: cronId }, data });
  return NextResponse.json({ success: true, data: job });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; cronId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, cronId } = await params;
  if (!await ownsJob(session.user.id, id, cronId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.cronjob.delete({ where: { id: cronId } });
  return NextResponse.json({ success: true });
}
