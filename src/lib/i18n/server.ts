import { cookies } from "next/headers";
import { translate, Locale } from "./dictionaries";

// Server-side translation for Server Components: locale comes from the cookie
// set by LocaleProvider on the client.
export async function getServerT(): Promise<{ locale: Locale; t: (key: string) => string }> {
  const c = await cookies();
  const raw = c.get("locale")?.value;
  const locale: Locale = raw === "en" ? "en" : "vi";
  return { locale, t: (key: string) => translate(locale, key) };
}
