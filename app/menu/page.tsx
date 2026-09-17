"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseAnon } from "@/lib/supabase";
import type { MenuItem } from "@/lib/types";
import { CategoryTabs, type CategoryTab } from "@/components/CategoryTabs";
import { HowToOrderSteps } from "@/components/HowToOrderSteps";
import { MenuItemCard } from "@/components/MenuItemCard";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { FloatingCartButton } from "@/components/FloatingCartButton";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseAnon
        .from("menu_items")
        .select(
          "id, category, name, description, price, image_url, is_available, sort_order, created_at"
        )
        .eq("is_available", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error("[menu] fetch failed:", error.message);
        setItems([]);
      } else {
        setItems(data ?? []);
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

  const tabs: CategoryTab[] = useMemo(
    () =>
      grouped
        .map(([category, list]) => ({ id: category, label: category }))
        .sort((a, b) => a.label.localeCompare(b.label, "ar")),
    [grouped]
  );

  const activeGroup = useMemo(
    () => grouped.find(([category]) => category === activeId) ?? grouped[0],
    [grouped, activeId]
  );

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
