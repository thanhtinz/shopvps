import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: any = search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, status: true, balance: true, createdAt: true, emailVerified: true }, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ success: true, data: { users, total, page, totalPages: Math.ceil(total/perPage) } });
}

export async function PATCH(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, action, value } = await req.json();
  if (!userId) return NextResponse.json({ error: t("Thiếu userId") }, { status: 400 });

  if (action === "toggle_status") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!user) return NextResponse.json({ error: t("User không tồn tại") }, { status: 404 });
    await prisma.user.update({ where: { id: userId }, data: { status: user.status === "ACTIVE" ? "BANNED" : "ACTIVE" } });
  } else if (action === "adjust_balance") {
    if (typeof value !== "number" || !Number.isFinite(value) || value === 0)
      return NextResponse.json({ error: t("Giá trị điều chỉnh không hợp lệ") }, { status: 400 });
    // Adjust and record an audit transaction in one atomic step.
    await prisma.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: value } },
        select: { balance: true },
      });
      const balanceAfter = Number(updated.balance);
      await tx.transaction.create({
        data: {
          userId, type: "ADJUSTMENT", amount: value,
          balanceBefore: balanceAfter - value, balanceAfter,
          description: `Admin điều chỉnh số dư bởi ${(session.user as any).email || "admin"}`,
          status: "COMPLETED",
        },
      });
    });
  } else if (action === "set_role") {
    // Only SUPER_ADMIN may change staff roles, and never touch a SUPER_ADMIN.
    if ((session.user as any).role !== "SUPER_ADMIN")
      return NextResponse.json({ error: t("Chỉ SUPER_ADMIN được đổi vai trò") }, { status: 403 });
    if (!["USER", "ADMIN"].includes(value))
      return NextResponse.json({ error: t("Vai trò không hợp lệ") }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) return NextResponse.json({ error: t("User không tồn tại") }, { status: 404 });
    if (target.role === "SUPER_ADMIN")
      return NextResponse.json({ error: t("Không thể đổi vai trò SUPER_ADMIN") }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { role: value } });
  } else {
    return NextResponse.json({ error: t("Hành động không hợp lệ") }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
