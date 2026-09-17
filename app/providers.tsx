"use client";

import { CartProvider } from "@/lib/cart-context";
import { MessengerContextProvider } from "@/lib/messenger-context";
import { CartPanel } from "@/components/CartPanel";
import { AddedToast } from "@/components/AddedToast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MessengerContextProvider>
      <CartProvider>
        {children}
        <CartPanel />
        <AddedToast />
      </CartProvider>
    </MessengerContextProvider>
  );
}
