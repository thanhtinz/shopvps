import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const session = await auth();
  if (!session || !["ADMIN","SUPER_ADMIN"].includes((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, action, value } = await req.json();
  if (action === "toggle_status") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.update({ where: { id: userId }, data: { status: user?.status === "ACTIVE" ? "BANNED" : "ACTIVE" } });
  } else if (action === "adjust_balance") {
    await prisma.user.update({ where: { id: userId }, data: { balance: { increment: value } } });
  }
  return NextResponse.json({ success: true });
}
