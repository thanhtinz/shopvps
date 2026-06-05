"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance, DEFAULT_APPEARANCE, applyAppearance, loadAppearance, saveAppearance } from "@/lib/appearance";

type Ctx = { appearance: Appearance; update: (patch: Partial<Appearance>) => void; reset: () => void };
const AppearanceCtx = createContext<Ctx>({ appearance: DEFAULT_APPEARANCE, update: () => {}, reset: () => {} });

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setApp] = useState<Appearance>(DEFAULT_APPEARANCE);

  useEffect(() => {
    const a = loadAppearance();
    setApp(a);
    applyAppearance(a);
  }, []);

  function update(patch: Partial<Appearance>) {
    setApp((prev) => {
      const next = { ...prev, ...patch };
      applyAppearance(next);
      saveAppearance(next);
      return next;
    });
  }
  function reset() { update(DEFAULT_APPEARANCE); }

  return <AppearanceCtx.Provider value={{ appearance, update, reset }}>{children}</AppearanceCtx.Provider>;
}

export const useAppearance = () => useContext(AppearanceCtx);
