import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const setup = await prisma.appSetup.findUnique({ where: { id: "singleton" } });
    if (!setup) {
      const res = NextResponse.json({ status: "NOT_SETUP" });
      res.cookies.set("__ls", "NOT_SETUP", { httpOnly: true, path: "/", maxAge: 60 });
      return res;
    }
    return NextResponse.json({ status: setup.verifyStatus, domain: setup.domain, expiresAt: setup.expiresAt });
  } catch {
    return NextResponse.json({ status: "NOT_SETUP" });
  }
}
