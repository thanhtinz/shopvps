import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_MODULES } from "@/lib/permissions";
import { getServerT } from "@/lib/i18n/server";

// Staff/RBAC management — SUPER_ADMIN only (guarding against an ADMIN with the
// "users" module escalating their own permissions).
async function isSuper(s: any) { return s && (s.user as any).role === "SUPER_ADMIN"; }
const VALID = new Set(ADMIN_MODULES.map((m) => m.key));

export async function GET() {
  const session = await auth();
  if (!await isSuper(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, name: true, email: true, role: true, adminPermissions: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ success: true, data: { staff, modules: ADMIN_MODULES } });
}

export async function PATCH(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isSuper(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.userId) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: b.userId } });
  if (!target) return NextResponse.json({ error: t("Không tìm thấy") }, { status: 404 });
  if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: t("Không thể chỉnh sửa Super Admin") }, { status: 400 });

  const data: any = {};
  if (Array.isArray(b.permissions)) data.adminPermissions = b.permissions.filter((p: string) => VALID.has(p));
  if (b.role === "ADMIN" || b.role === "USER") data.role = b.role; // promote/demote staff
  await prisma.user.update({ where: { id: b.userId }, data });
  return NextResponse.json({ success: true });
}
