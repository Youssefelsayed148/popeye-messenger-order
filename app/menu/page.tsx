"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseAnon } from "@/lib/supabase";
import type { MenuItem, Offer } from "@/lib/types";
import { CategoryTabs, type CategoryTab } from "@/components/CategoryTabs";
import { HowToOrderSteps } from "@/components/HowToOrderSteps";
import { MenuItemCard } from "@/components/MenuItemCard";
import { OfferCard } from "@/components/OfferCard";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { FloatingCartButton } from "@/components/FloatingCartButton";

const OFFERS_TAB_ID = "__offers__";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [menuRes, offersRes] = await Promise.all([
        supabaseAnon
          .from("menu_items")
          .select(
            "id, category, name, description, price, image_url, is_available, sort_order, created_at"
          )
          .eq("is_available", true)
          .order("sort_order", { ascending: true }),
        supabaseAnon
          .from("offers")
          .select(
            "id, name, description, price, image_url, is_available, sort_order, created_at"
          )
          .eq("is_available", true)
          .order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;
      if (menuRes.error) {
        console.error("[menu] fetch failed:", menuRes.error.message);
        setItems([]);
      } else {
        setItems(menuRes.data ?? []);
      }
      if (offersRes.error) {
        console.error("[offers] fetch failed:", offersRes.error.message);
        setOffers([]);
      } else {
        setOffers(offersRes.data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category);
      if (list) list.push(item);
      else map.set(item.category, [item]);
    }
    return Array.from(map.entries()).map(
      ([category, list]): [string, MenuItem[]] => [
        category,
        [
          ...list.filter((i) => i.image_url),
          ...list.filter((i) => !i.image_url),
        ],
      ]
    );
  }, [items]);

  const tabs: CategoryTab[] = useMemo(() => {
    const categoryTabs = grouped
      .map(([category, list]) => ({ id: category, label: category }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
    return offers.length > 0
      ? [{ id: OFFERS_TAB_ID, label: "العروض" }, ...categoryTabs]
      : categoryTabs;
  }, [grouped, offers]);

  const activeGroup = useMemo(
    () => grouped.find(([category]) => category === activeId) ?? grouped[0],
    [grouped, activeId]
  );

  const isOffersActive = activeId === OFFERS_TAB_ID;

  useEffect(() => {
    if (!loading && tabs.length > 0 && !activeId) {
      setActiveId(tabs[0].id);
    }
  }, [loading, tabs, activeId]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4">
      <header className="mb-4">
        <HowToOrderSteps />
      </header>

      {tabs.length > 0 && (
        <CategoryTabs
          tabs={tabs}
          activeId={activeId}
          onSelect={setActiveId}
        />
      )}

      <div className="mt-6">
        {loading ? (
          <SkeletonGrid count={6} />
        ) : isOffersActive ? (
          offers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              مفيش عروض متاحة دلوقتي
            </p>
          ) : (
            <section className="mb-8 scroll-mt-24">
              <h2 className="mb-3 border-b-2 border-ink pb-2 font-sans text-lg font-black text-ink">
                العروض
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {offers.map((offer, idx) => (
                  <OfferCard key={offer.id} offer={offer} index={idx + 1} />
                ))}
              </div>
            </section>
          )
        ) : items.length === 0 ? (
          <EmptyState
            title="قريباً"
            message="بنحضّر المنيو دلوقتي، ارجع تاني شوية."
          />
        ) : activeGroup ? (
          <section
            key={activeGroup[0]}
            id={`cat-${activeGroup[0]}`}
            className="mb-8 scroll-mt-24"
          >
            <h2 className="mb-3 border-b-2 border-ink pb-2 font-sans text-lg font-black text-ink">
              {activeGroup[0]}
            </h2>
            {activeGroup[1].length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                قريباً هنضيف أصناف هنا
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {activeGroup[1].map((item, idx) => (
                  <MenuItemCard key={item.id} item={item} index={idx + 1} />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      <FloatingCartButton />
    </main>
  );
}
