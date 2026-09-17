"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseAnon } from "@/lib/supabase";
import type { MenuItem } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { formatEgp } from "@/lib/format";
import { ItemImage } from "@/components/ItemImage";
import { FloatingCartButton } from "@/components/FloatingCartButton";

export default function ItemDetailPage() {
  const params = useParams<{ itemId: string }>();
  const itemId = params?.itemId ?? "";

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const { add, openCart } = useCart();

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabaseAnon
        .from("menu_items")
        .select(
          "id, category, name, description, price, image_url, is_available, sort_order, created_at"
        )
        .eq("id", itemId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("[item] fetch failed:", error.message);
        setNotFound(true);
      } else if (!data) {
        setNotFound(true);
      } else {
        setItem(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const subtotal = useMemo(
    () => (item ? item.price * qty : 0),
    [item, qty]
  );

  const handleAdd = () => {
    if (!item) return;
    add({ item_id: item.id, name: item.name, price: item.price }, qty);
    openCart();
  };

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-32 pt-4">
        <div className="aspect-square w-full animate-pulse rounded-xl bg-ink/5" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-ink/5" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-ink/5" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-ink/5" />
        <FloatingCartButton />
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-24 pt-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div
            aria-hidden
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sauce/15"
          >
            <span className="font-display text-3xl text-sauce">?</span>
          </div>
          <h2 className="mb-2 font-sans text-xl font-semibold text-ink">
            الصنف مش موجود
          </h2>
          <p className="mb-6 max-w-xs text-sm text-muted">
            ممكن يكون اتشال من المنيو أو الرابط مش صحيح.
          </p>
          <Link
            href="/menu"
            className="inline-flex h-12 items-center rounded-full bg-sauce px-6 font-sans text-sm font-semibold text-paper transition active:scale-95"
          >
            ارجع للمنيو
          </Link>
        </div>
        <FloatingCartButton />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl pb-32">
      <div className="relative aspect-square w-full overflow-hidden">
        <ItemImage src={item.image_url} alt={item.name} priority />
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-sans text-2xl font-black leading-tight text-ink">
            {item.name}
          </h1>
          <span className="num-badge shrink-0 text-3xl leading-none text-sauce">
            {formatEgp(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {item.description}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-ink/10 bg-paper px-4 py-3">
          <span className="font-sans text-sm font-semibold text-ink-soft">
            الكمية
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="نقص الكمية"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 font-display text-2xl text-ink transition active:scale-95 disabled:opacity-40"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="num-badge min-w-10 text-center text-2xl text-ink"
            >
              {qty}
            </span>
            <button
              type="button"
              aria-label="زيادة الكمية"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sauce font-display text-2xl text-paper transition active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-cream/95 px-4 pb-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-cream/90">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-14 flex-1 items-center justify-between rounded-full bg-sauce px-5 font-sans text-base font-semibold text-paper shadow-[0_8px_24px_rgba(220,31,38,0.35)] transition active:scale-[0.98]"
          >
            <span>أضف للسلة</span>
            <span className="num-badge text-xl text-paper">
              {formatEgp(subtotal)}
            </span>
          </button>
        </div>
      </div>

      <FloatingCartButton />
    </main>
  );
}
