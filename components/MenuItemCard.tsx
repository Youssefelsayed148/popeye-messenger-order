"use client";

import { useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import { formatEgp } from "@/lib/format";
import { ItemImage } from "./ItemImage";
import { useCart } from "@/lib/cart-context";

export function MenuItemCard({
  item,
  index,
}: {
  item: MenuItem;
  index?: number;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const stop = (e: React.MouseEvent) => e.preventDefault();

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    add({ item_id: item.id, name: item.name, price: item.price }, qty);
    setQty(1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    stop(e);
    setQty((q) => q + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    stop(e);
    setQty((q) => Math.max(1, q - 1));
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-paper transition hover:border-sauce hover:shadow-lg">
      <Link
        href={`/menu/${item.id}`}
        className="flex flex-1 flex-col active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sauce"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream">
          <ItemImage
            src={item.image_url}
            alt={item.name}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          {typeof index === "number" && (
            <span
              aria-hidden
              className="num-badge absolute right-2 top-2 z-10 rounded-full bg-paper/90 px-2 py-0.5 text-[11px] font-bold leading-none text-muted shadow-sm ring-1 ring-ink/5"
            >
              {String(index).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-3 pb-2 pt-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-sans text-sm font-black leading-tight text-ink">
              {item.name}
            </h3>
            <span className="num-badge shrink-0 text-lg leading-none text-sauce">
              {formatEgp(item.price)}
            </span>
          </div>
          {item.description && (
            <p className="mt-1 line-clamp-2 font-sans text-xs leading-snug text-muted">
              {item.description}
            </p>
          )}
        </div>
      </Link>
      <div className="mx-3 mb-3 mt-1 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="نقص الكمية"
          onClick={handleDecrease}
          disabled={qty <= 1}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 font-display text-lg text-ink transition active:scale-95 disabled:opacity-40"
        >
          −
        </button>
        <span
          aria-live="polite"
          className="num-badge min-w-7 text-center text-base text-ink"
        >
          {qty}
        </span>
        <button
          type="button"
          aria-label="زيادة الكمية"
          onClick={handleIncrease}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 font-display text-lg text-ink transition active:scale-95"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`أضف ${item.name} للسلة`}
        className="mx-3 mb-3 flex h-9 items-center justify-center rounded-full bg-sauce font-sans text-xs font-bold text-paper transition active:scale-95 hover:bg-sauce-dark"
      >
        أضف للسلة
      </button>
    </div>
  );
}
