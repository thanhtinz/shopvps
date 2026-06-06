import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cronjobLimit } from "@/lib/products";
import { isValidCron } from "@/lib/cron";
import { getServerT } from "@/lib/i18n/server";

async function ownedCronOrder(userId: string, id: string) {
  return prisma.productOrder.findFirst({ where: { id, userId, category: "CRONJOB" }, include: { product: { select: { specs: true } }, cronjobs: true } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await ownedCronOrder(session.user.id, id);
  if (!order) return NextResponse.json({ error: t("Không tìm thấy dịch vụ") }, { status: 404 });
  if (order.status !== "ACTIVE") return NextResponse.json({ error: t("Chỉ áp dụng cho dịch vụ đang hoạt động") }, { status: 400 });

  const { name, url, method, schedule } = await req.json();
  if (!name || !url || !schedule) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: t("URL không hợp lệ") }, { status: 400 });
  if (!isValidCron(schedule)) return NextResponse.json({ error: t("Biểu thức cron không hợp lệ") }, { status: 400 });

  const limit = cronjobLimit((order.product as any)?.specs);
  if (order.cronjobs.length >= limit) return NextResponse.json({ error: `${t("Đã đạt giới hạn số cronjob")} (${limit})` }, { status: 400 });

  const job = await prisma.cronjob.create({
    data: { orderId: id, name: String(name).slice(0, 120), url: String(url), method: ["GET", "POST", "HEAD"].includes(method) ? method : "GET", schedule: String(schedule).trim() },
  });
  return NextResponse.json({ success: true, data: job });
}
