import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditPendingDeposit } from "@/lib/payments/credit";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

// Pending deposits awaiting manual confirmation.
export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.transaction.findMany({
    where: { type: "DEPOSIT", status: "PENDING" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ success: true, data: items });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { reference, action } = await req.json();
  if (!reference || !["approve", "reject"].includes(action))
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });

  if (action === "reject") {
    await prisma.transaction.updateMany({ where: { reference, status: "PENDING" }, data: { status: "FAILED" } });
    return NextResponse.json({ success: true });
  }
  const r = await creditPendingDeposit(reference);
  if (!r.ok) return NextResponse.json({ error: "Không thể duyệt giao dịch" }, { status: 400 });
  return NextResponse.json({ success: true });
}
