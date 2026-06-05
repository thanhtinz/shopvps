import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getServerT } from "@/lib/i18n/server";
import { translate, Locale } from "@/lib/i18n/dictionaries";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, vpsOrderId, hostingOrderId, permissions } = await req.json();
  if (!email) return NextResponse.json({ error: t("Email không hợp lệ") }, { status: 400 });

  // Only allow sharing services the inviter actually owns (prevent referencing
  // another user's order id).
  if (vpsOrderId) {
    const owned = await prisma.vpsOrder.findFirst({ where: { id: vpsOrderId, userId: session.user.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: t("Dịch vụ không hợp lệ") }, { status: 403 });
  }
  if (hostingOrderId) {
    const owned = await prisma.hostingOrder.findFirst({ where: { id: hostingOrderId, userId: session.user.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: t("Dịch vụ không hợp lệ") }, { status: 403 });
  }

  let team = await prisma.team.findFirst({ where: { ownerId: session.user.id } });
  if (!team) team = await prisma.team.create({ data: { name: `Team của ${session.user.name || session.user.email}`, ownerId: session.user.id } });

  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) return NextResponse.json({ error: t("Email chưa có tài khoản ShopVPS") }, { status: 404 });

  const existing = await prisma.teamMember.findFirst({ where: { teamId: team.id, userId: invitedUser.id } });
  if (existing) return NextResponse.json({ error: t("Đã trong team") }, { status: 400 });

  const member = await prisma.teamMember.create({
    data: { teamId: team.id, userId: invitedUser.id, email, vpsOrderId: vpsOrderId || null, hostingOrderId: hostingOrderId || null, ...permissions },
  });

  try {
    const rl = (invitedUser.locale as Locale) || "vi";
    const tr = (k: string) => translate(rl, k);
    await sendEmail({ to: email, subject: tr("Bạn được mời vào team trên ShopVPS"), html: `<p>${session.user.name} ${tr("đã mời bạn.")} <a href="${process.env.NEXT_PUBLIC_APP_URL}/team">${tr("Xem ngay")}</a></p>` });
  } catch {}

  return NextResponse.json({ success: true, data: member });
}
