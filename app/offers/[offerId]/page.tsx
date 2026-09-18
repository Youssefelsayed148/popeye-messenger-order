"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseAnon } from "@/lib/supabase";
import type { MenuItem, Offer, OfferItem } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { formatEgp } from "@/lib/format";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ItemImage } from "@/components/ItemImage";

const SANDWICH_CATEGORY_HINT = "ساندوتش";

type SelectableSlot = {
  key: string;
  offerItem: OfferItem;
  slotIndex: number;
  candidates: MenuItem[];
};

export default function OfferDetailPage() {
  const params = useParams<{ offerId: string }>();
  const offerId = params?.offerId ?? "";

  const [offer, setOffer] = useState<Offer | null>(null);
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bundleQty, setBundleQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const { add, openCart } = useCart();

  useEffect(() => {
    if (!offerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);

      const [offerRes, offerItemsRes, menuRes] = await Promise.all([
        supabaseAnon
          .from("offers")
          .select(
            "id, name, description, price, image_url, is_available, sort_order, created_at"
          )
          .eq("id", offerId)
          .eq("is_available", true)
          .maybeSingle(),
        supabaseAnon
          .from("offer_items")
          .select(
            "id, offer_id, item_name, category_hint, quantity, is_selectable, is_free, item_price, sort_order"
          )
          .eq("offer_id", offerId)
          .order("sort_order", { ascending: true }),
        supabaseAnon
          .from("menu_items")
          .select(
            "id, category, name, description, price, image_url, is_available, sort_order, created_at"
          )
          .eq("is_available", true),
      ]);

      if (cancelled) return;

      if (offerRes.error || !offerRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setOffer(offerRes.data);
      setOfferItems(offerItemsRes.data ?? []);
      setMenuItems(menuRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [offerId]);

  const selectableSlots: SelectableSlot[] = useMemo(() => {
    const slots: SelectableSlot[] = [];
    for (const oi of offerItems) {
      if (!oi.is_selectable) continue;
      const candidates = menuItems.filter((m) =>
        oi.category_hint
          ? m.category === oi.category_hint
          : m.category.includes(SANDWICH_CATEGORY_HINT)
      );
      for (let i = 0; i < oi.quantity; i++) {
        slots.push({
          key: `${oi.id}:${i}`,
          offerItem: oi,
          slotIndex: i,
          candidates,
        });
      }
    }
    return slots;
  }, [offerItems, menuItems]);

  const includedItems = useMemo(
    () => offerItems.filter((oi) => !oi.is_selectable),
    [offerItems]
  );

  const allSlotsFilled =
    selectableSlots.length > 0 &&
    selectableSlots.every((slot) => Boolean(selections[slot.key]));

  const perBundlePrice = useMemo(() => {
    if (!offer) return 0;
    if (offer.price != null) return offer.price;
    let total = 0;
    for (const slot of selectableSlots) {
      const chosenId = selections[slot.key];
      const chosen = slot.candidates.find((m) => m.id === chosenId);
      if (chosen) total += chosen.price;
    }
    for (const oi of includedItems) {
      if (!oi.is_free && oi.item_price != null) total += oi.item_price;
    }
    return total;
  }, [offer, selectableSlots, selections, includedItems]);

  const subtotal = perBundlePrice * bundleQty;

  const handleSelect = (slotKey: string, menuItemId: string) => {
    setSelections((prev) => ({ ...prev, [slotKey]: menuItemId }));
  };

  const handleAdd = () => {
    if (!offer || !allSlotsFilled) return;
    const chosenIds = selectableSlots.map((slot) => selections[slot.key]);
    const chosenNames = selectableSlots
      .map((slot) => slot.candidates.find((m) => m.id === selections[slot.key])?.name)
      .filter(Boolean)
      .join("، ");
    const name = chosenNames ? `${offer.name} (${chosenNames})` : offer.name;
    add(
      {
        item_id: `offer:${offer.id}:${chosenIds.join(",")}`,
        name,
        price: perBundlePrice,
        offer_id: offer.id,
        selections: chosenIds,
      },
      bundleQty
    );
    openCart();
  };

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-32 pt-4">
        <div className="h-6 w-2/3 animate-pulse rounded bg-ink/5" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-ink/5" />
        <FloatingCartButton />
      </main>
    );
  }

  if (notFound || !offer) {
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
            العرض مش متاح
          </h2>
          <p className="mb-6 max-w-xs text-sm text-muted">
            ممكن يكون العرض انتهى أو الرابط مش صحيح.
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-32 pt-4">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-cream">
        <ItemImage
          src={offer.image_url}
          alt={offer.name}
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="font-sans text-2xl font-black leading-tight text-ink">
          {offer.name}
        </h1>
        <span className="num-badge shrink-0 text-2xl leading-none text-sauce">
          {formatEgp(perBundlePrice)}
        </span>
      </div>
      {offer.description && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {offer.description}
        </p>
      )}

      {selectableSlots.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="font-sans text-sm font-bold text-ink">اختار الأصناف</h2>
          {selectableSlots.map((slot, idx) => (
            <div
              key={slot.key}
              className="rounded-2xl border border-ink/10 bg-paper px-4 py-3"
            >
              <label className="mb-1 block font-sans text-xs font-semibold text-ink-soft">
                {slot.offerItem.item_name} {selectableSlots.length > 1 ? `#${idx + 1}` : ""}
              </label>
              <select
                value={selections[slot.key] ?? ""}
                onChange={(e) => handleSelect(slot.key, e.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 font-sans text-sm text-ink"
              >
                <option value="" disabled>
                  اختار...
                </option>
                {slot.candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {formatEgp(m.price)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {includedItems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-sans text-sm font-bold text-ink">متضمن</h2>
          <ul className="space-y-1">
            {includedItems.map((oi) => (
              <li
                key={oi.id}
                className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2 font-sans text-sm text-ink-soft"
              >
                <span>
                  {oi.quantity > 1 ? `${oi.quantity}× ` : ""}
                  {oi.item_name}
                </span>
                {oi.is_free && (
                  <span className="rounded-full bg-sauce/10 px-2 py-0.5 text-xs font-bold text-sauce">
                    هدية
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-ink/10 bg-paper px-4 py-3">
        <span className="font-sans text-sm font-semibold text-ink-soft">الكمية</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="نقص الكمية"
            onClick={() => setBundleQty((q) => Math.max(1, q - 1))}
            disabled={bundleQty <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 font-display text-2xl text-ink transition active:scale-95 disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="num-badge min-w-10 text-center text-2xl text-ink">
            {bundleQty}
          </span>
          <button
            type="button"
            aria-label="زيادة الكمية"
            onClick={() => setBundleQty((q) => q + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-sauce font-display text-2xl text-paper transition active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-cream/95 px-4 pb-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-cream/90">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectableSlots.length > 0 && !allSlotsFilled}
            className="flex h-14 flex-1 items-center justify-between rounded-full bg-sauce px-5 font-sans text-base font-semibold text-paper shadow-[0_8px_24px_rgba(220,31,38,0.35)] transition active:scale-[0.98] disabled:opacity-40"
          >
            <span>أضف للسلة</span>
            <span className="num-badge text-xl text-paper">{formatEgp(subtotal)}</span>
          </button>
        </div>
      </div>

      <FloatingCartButton />
    </main>
  );
}
