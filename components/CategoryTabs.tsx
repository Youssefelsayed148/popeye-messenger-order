"use client";

import { useEffect, useRef } from "react";

export type CategoryTab = { id: string; label: string };

type Props = {
  tabs: CategoryTab[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function CategoryTabs({ tabs, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const btn = buttonRefs.current.get(activeId);
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const offset =
      bRect.left - cRect.left - cRect.width / 2 + bRect.width / 2;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-ink/10 bg-cream/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-cream/90">
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="أقسام المنيو"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(tab.id, el);
                else buttonRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-sans text-sm font-bold transition ${
                isActive
                  ? "bg-sauce text-paper shadow-md"
                  : "border border-ink/10 bg-paper text-ink-soft hover:border-sauce/40 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
