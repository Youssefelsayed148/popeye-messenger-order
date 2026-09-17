"use client";

import { useCart } from "@/lib/cart-context";

export function FloatingCartButton() {
  const { totalCount, isHydrated, isOpen, openCart } = useCart();

  if (!isHydrated || totalCount === 0 || isOpen) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`فتح السلة (${totalCount} صنف)`}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-sauce px-5 py-3.5 font-sans text-sm font-bold text-paper shadow-[0_8px_24px_rgba(220,31,38,0.35)] transition hover:bg-sauce-dark active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sauce/60"
    >
      <CartIcon className="h-5 w-5" />
      <span className="hidden sm:inline">السلة</span>
      <span
        aria-hidden
        className="num-badge flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold leading-none text-sauce"
      >
        {totalCount > 99 ? "99+" : totalCount}
      </span>
    </button>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}
