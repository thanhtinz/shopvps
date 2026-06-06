import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTld, isValidDomain } from "@/lib/domains";
import { checkDomainAvailability } from "@/lib/registrars";
import { getServerT } from "@/lib/i18n/server";

export async function GET(req: NextRequest) {
  const { t } = await getServerT();
  const domain = (new URL(req.url).searchParams.get("domain") || "").toLowerCase().trim();
  if (!isValidDomain(domain)) return NextResponse.json({ error: t("Tên miền không hợp lệ") }, { status: 400 });

  const tld = await resolveTld(domain);
  if (!tld) return NextResponse.json({ error: t("Đuôi tên miền không được hỗ trợ") }, { status: 400 });

  // Taken internally?
  const owned = await prisma.domainOrder.findFirst({ where: { domain, status: { in: ["ACTIVE", "PENDING"] } } });
  if (owned) return NextResponse.json({ success: true, data: { domain, available: false, tld: tld.tld, registerPrice: Number(tld.registerPrice) } });

  const available = await checkDomainAvailability(domain);
  return NextResponse.json({
    success: true,
    data: {
      domain, available, unknown: available === null, tld: tld.tld,
      registerPrice: Number(tld.registerPrice),
      transferPrice: Number(tld.transferPrice),
    },
  });
}
