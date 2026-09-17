"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  item_id: string;
  name: string;
  price: number;
  qty: number;
};

export type LastAdded = { name: string; ts: number };

type CartContextValue = {
  items: CartLine[];
  totalCount: number;
  subtotal: number;
  isHydrated: boolean;
  isOpen: boolean;
  lastAdded: LastAdded | null;
  openCart: () => void;
  closeCart: () => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (item_id: string) => void;
  updateQty: (item_id: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "popeye.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

function isValidLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.item_id === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    Number.isFinite(v.price) &&
    typeof v.qty === "number" &&
    Number.isInteger(v.qty) &&
    v.qty >= 1
  );
}

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidLine);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setItems(parseStored(stored));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const add = useCallback<CartContextValue["add"]>((line, qty = 1) => {
    if (qty < 1) return;
    setItems((prev) => {
      const idx = prev.findIndex((l) => l.item_id === line.item_id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { ...line, qty }];
    });
    setLastAdded({ name: line.name, ts: Date.now() });
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((item_id) => {
    setItems((prev) => prev.filter((l) => l.item_id !== item_id));
  }, []);

  const updateQty = useCallback<CartContextValue["updateQty"]>(
    (item_id, qty) => {
      if (qty < 1) return;
      setItems((prev) =>
        prev.map((l) => (l.item_id === item_id ? { ...l, qty } : l))
      );
    },
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, l) => sum + l.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, l) => sum + l.price * l.qty, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalCount,
      subtotal,
      isHydrated,
      isOpen,
      lastAdded,
      openCart,
      closeCart,
      add,
      remove,
      updateQty,
      clear,
    }),
    [
      items,
      totalCount,
      subtotal,
      isHydrated,
      isOpen,
      lastAdded,
      openCart,
      closeCart,
      add,
      remove,
      updateQty,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
