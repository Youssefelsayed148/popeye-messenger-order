"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

const VISIBLE_MS = 1800;

export function AddedToast() {
  const { lastAdded } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  if (!lastAdded) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 right-5 z-40 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-sans text-xs font-bold text-paper shadow-lg transition duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <span aria-hidden className="text-sauce">
        ✓
      </span>
      <span>أضيف: {lastAdded.name}</span>
    </div>
  );
}
