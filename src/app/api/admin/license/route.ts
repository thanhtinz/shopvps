import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndRefreshLicense } from "@/lib/license";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

function mask(s: string | null | undefined): string {
  if (!s) return "—";
  if (s.length <= 8) return "••••";
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const setup = await prisma.appSetup.findUnique({ where: { id: "singleton" } });
  if (!setup) return NextResponse.json({ success: true, data: { status: "NOT_SETUP" } });
  return NextResponse.json({
    success: true,
    data: {
      status: setup.verifyStatus,
      domain: setup.domain,
      productId: setup.productId,
      version: setup.version,
      licenseKey: mask(setup.licenseKey),
      runtimeKey: mask(setup.runtimeKey),
      hwFingerprint: setup.hwFingerprint ? `${setup.hwFingerprint.slice(0, 12)}…` : "—",
      expiresAt: setup.expiresAt,
      lastVerifiedAt: setup.lastVerifiedAt,
      setupAt: setup.setupAt,
      setupBy: setup.setupBy,
    },
  });
}

// Re-verify against the license server on demand.
export async function POST() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const state = await checkAndRefreshLicense();
    return NextResponse.json({ success: true, data: state });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Verify thất bại" }, { status: 500 });
  }
}
