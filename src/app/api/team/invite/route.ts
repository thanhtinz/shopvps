import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, vpsOrderId, hostingOrderId, permissions } = await req.json();
  if (!email) return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });

  let team = await prisma.team.findFirst({ where: { ownerId: session.user.id } });
  if (!team) team = await prisma.team.create({ data: { name: `Team của ${session.user.name || session.user.email}`, ownerId: session.user.id } });

  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) return NextResponse.json({ error: "Email chưa có tài khoản ShopVPS" }, { status: 404 });

  const existing = await prisma.teamMember.findFirst({ where: { teamId: team.id, userId: invitedUser.id } });
  if (existing) return NextResponse.json({ error: "Đã trong team" }, { status: 400 });

  const member = await prisma.teamMember.create({
    data: { teamId: team.id, userId: invitedUser.id, email, vpsOrderId: vpsOrderId || null, hostingOrderId: hostingOrderId || null, ...permissions },
  });

  try {
    await sendEmail({ to: email, subject: `Bạn được mời vào team trên ShopVPS`, html: `<p>${session.user.name} đã mời bạn. <a href="${process.env.NEXT_PUBLIC_APP_URL}/team">Xem ngay</a></p>` });
  } catch {}

  return NextResponse.json({ success: true, data: member });
}
