"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseAnon } from "@/lib/supabase";
import type { MenuItem } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useMessengerContext } from "@/lib/messenger-context";
import { formatEgp } from "@/lib/format";
import { ItemImage } from "@/components/ItemImage";

export function CartPanel() {
  const {
    items,
    subtotal,
    isHydrated,
    isOpen,
    closeCart,
    updateQty,
    remove,
    clear,
  } = useCart();
  const { isMessengerContext, isReady, debugError } = useMessengerContext();
  const router = useRouter();
  const [images, setImages] = useState<Record<string, string | null>>({});

  const idsKey = useMemo(
    () => items.map((l) => l.item_id).sort().join(","),
    [items]
  );

  useEffect(() => {
    if (!isOpen || !isHydrated || items.length === 0) {
      setImages({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseAnon
        .from("menu_items")
        .select("id, image_url")
        .in(
          "id",
          items.map((l) => l.item_id)
        );
      if (cancelled) return;
      if (error) {
        console.warn("[cart-panel] image lookup failed:", error.message);
        return;
      }
      const next: Record<string, string | null> = {};
      for (const row of data ?? []) {
        next[(row as Pick<MenuItem, "id" | "image_url">).id] =
          (row as Pick<MenuItem, "id" | "image_url">).image_url;
      }
      setImages(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey, isOpen, isHydrated, items]);

  const cartEmpty = isHydrated && items.length === 0;
  const inMessenger = isReady && isMessengerContext;
  const canCheckout = inMessenger && !cartEmpty;

  const blockReason: string | null = useMemo(() => {
    if (cartEmpty) return "السلة فاضية — ضيف أصناف من المنيو الأول";
    if (!isReady) return "بنتحقق من ماسنجر…";
    if (!isMessengerContext)
      return "افتح الصفحة من داخل ماسنجر لإتمام الطلب";
    return null;
  }, [cartEmpty, isReady, isMessengerContext]);

  const handleCheckout = () => {
    if (!canCheckout) return;
    closeCart();
    router.push("/checkout");
  };

  const handleClear = () => {
    if (typeof window !== "undefined" && !window.confirm("تأكيد إفراغ السلة بالكامل؟")) {
      return;
    }
    clear();
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="سلة الطلب">
      <div
        aria-hidden
        onClick={closeCart}
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
      />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-paper shadow-2xl sm:w-[420px]">
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper p-5">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-sauce">
              YOUR ORDER
            </p>
            <h2 className="font-display text-2xl text-ink">سلة طلبك</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="إغلاق السلة"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sauce"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!inMessenger && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-xl border border-mustard/40 bg-mustard/10 px-3 py-2 text-sm text-ink-soft"
            >
              <span aria-hidden className="mt-0.5 text-mustard-dark">
                !
              </span>
              <p>لإتمام الطلب، افتح هذه الصفحة من داخل ماسنجر</p>
            </div>
          )}

          {!inMessenger && debugError && (
            <p
              dir="ltr"
              className="mb-4 break-all rounded-lg bg-ink/5 px-3 py-2 font-mono text-[11px] text-muted"
            >
              debug: {debugError}
            </p>
          )}

          {!isHydrated ? (
            <div className="space-y-3" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-ink/10 bg-paper p-3"
                >
                  <div className="h-20 w-20 animate-pulse rounded-lg bg-ink/5" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-ink/5" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-ink/5" />
                    <div className="mt-auto h-8 w-24 animate-pulse rounded-full bg-ink/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                aria-hidden
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sauce/10"
              >
                <span className="font-display text-3xl text-sauce">!</span>
              </div>
              <h3 className="mb-2 font-sans text-xl font-semibold text-ink">
                السلة فاضية
              </h3>
              <p className="max-w-xs text-sm text-muted">
                لسه مفيش أصناف في السلة. تصفح المنيو وضيف اللي يعجبك.
              </p>
              <Link
                href="/menu"
                onClick={closeCart}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-sauce px-6 font-sans text-sm font-semibold text-paper transition hover:bg-sauce-dark active:scale-95"
              >
                تصفح المنيو
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map((line) => (
                  <li
                    key={line.item_id}
                    className="flex gap-3 rounded-xl border border-ink/10 bg-paper p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                      <ItemImage
                        src={images[line.item_id] ?? null}
                        alt={line.name}
                        sizes="80px"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-sans text-sm font-black text-ink">
                          {line.name}
                        </h3>
                        <button
                          type="button"
                          aria-label={`إزالة ${line.name}`}
                          onClick={() => remove(line.item_id)}
                          className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-ink/5 hover:text-sauce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sauce"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <span className="num-badge mt-0.5 text-base text-sauce">
                        {formatEgp(line.price)}
                      </span>

                      <div className="mt-auto flex items-center gap-1 self-end">
                        <button
                          type="button"
                          aria-label="نقص الكمية"
                          onClick={() => updateQty(line.item_id, line.qty - 1)}
                          disabled={line.qty <= 1}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 font-display text-lg text-ink transition active:scale-95 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span
                          aria-live="polite"
                          className="num-badge min-w-7 text-center text-base text-ink"
                        >
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="زيادة الكمية"
                          onClick={() => updateQty(line.item_id, line.qty + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-sauce font-display text-lg text-paper transition active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleClear}
                className="mt-3 text-xs text-muted transition hover:text-sauce"
              >
                إفراغ السلة
              </button>
            </>
          )}
        </div>

        {!cartEmpty && (
          <div className="border-t border-ink/10 bg-paper p-5">
            <div className="space-y-1 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">المجموع الجزئي</span>
                <span className="num-badge font-bold text-sauce">
                  {formatEgp(subtotal)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">التوصيل</span>
                <span className="text-xs text-muted">
                  يتحدد حسب المنطقة في الخطوة التالية
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-2">
                <span className="font-black text-ink">الإجمالي</span>
                <span className="num-badge text-2xl font-black text-sauce">
                  {formatEgp(subtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canCheckout}
              onClick={handleCheckout}
              className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-sauce px-5 font-sans text-base font-bold text-paper shadow-[0_8px_24px_rgba(220,31,38,0.35)] transition hover:bg-sauce-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-muted disabled:shadow-none"
            >
              تأكيد الطلب
            </button>
            {blockReason && (
              <p aria-live="polite" className="mt-2 text-center text-xs text-muted">
                {blockReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
