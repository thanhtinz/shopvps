import { cookies } from "next/headers";
import { translate, Locale } from "./dictionaries";
import { prisma } from "@/lib/prisma";

// Server-side translation for Server Components: locale comes from the cookie
// set by LocaleProvider on the client.
export async function getServerT(): Promise<{ locale: Locale; t: (key: string) => string }> {
  const c = await cookies();
  const raw = c.get("locale")?.value;
  const locale: Locale = raw === "en" ? "en" : "vi";
  return { locale, t: (key: string) => translate(locale, key) };
}

// Translation bound to a specific user's stored locale preference. Use when
// composing text that will be shown to (or stored for) that user — e.g.
// in-app notifications and transaction descriptions written from API routes or
// background workers, where the request cookie may not belong to the recipient.
export async function getUserT(userId: string): Promise<{ locale: Locale; t: (key: string) => string }> {
  let locale: Locale = "vi";
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
    if (u?.locale === "en") locale = "en";
  } catch {}
  return { locale, t: (key: string) => translate(locale, key) };
}
