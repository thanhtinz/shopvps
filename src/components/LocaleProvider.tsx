"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Locale, translate } from "@/lib/i18n/dictionaries";

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string };
const LocaleCtx = createContext<Ctx>({ locale: "vi", setLocale: () => {}, t: (k) => k });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved === "vi" || saved === "en") {
        setLoc(saved);
        document.documentElement.lang = saved;
        document.cookie = `locale=${saved};path=/;max-age=31536000;samesite=lax`;
      }
    } catch {}
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLoc(l);
    try { localStorage.setItem("locale", l); } catch {}
    document.cookie = `locale=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return <LocaleCtx.Provider value={{ locale, setLocale, t }}>{children}</LocaleCtx.Provider>;
}

export const useLocale = () => useContext(LocaleCtx);
