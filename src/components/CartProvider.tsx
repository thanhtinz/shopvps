"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  key: string;
  type: "vps" | "hosting";
  packageId: string;
  packageName: string;
  cycle: string;            // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL
  priceMonthly: number;     // base monthly price; line total = priceMonthly * cycleMonths
  config: { os?: string; region?: string; hostname?: string; domain?: string };
}

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
};

const CartCtx = createContext<Ctx>({ items: [], add: () => {}, remove: () => {}, clear: () => {}, count: 0 });

function uid(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("cart", JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    setItems((prev) => [...prev, { ...item, key: uid() }]);
  }, []);
  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  return (
    <CartCtx.Provider value={{ items, add, remove, clear, count: items.length }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
