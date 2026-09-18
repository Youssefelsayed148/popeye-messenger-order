"use client";

import Link from "next/link";
import type { Offer } from "@/lib/types";
import { formatEgp } from "@/lib/format";

export function OfferCard({ offer, index }: { offer: Offer; index?: number }) {
  return (
    <Link
      href={`/offers/${offer.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-paper p-3 transition hover:border-sauce hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-sans text-sm font-black leading-tight text-ink">
          {typeof index === "number" ? `${String(index).padStart(2, "0")}. ` : ""}
          {offer.name}
        </h3>
        <span className="num-badge shrink-0 text-base leading-none text-sauce">
          {offer.price != null ? formatEgp(offer.price) : "يبدأ من"}
        </span>
      </div>
      {offer.description && (
        <p className="mt-1 line-clamp-2 font-sans text-xs leading-snug text-muted">
          {offer.description}
        </p>
      )}
      <span className="mt-2 self-start rounded-full bg-sauce/10 px-3 py-1 font-sans text-xs font-bold text-sauce">
        اختار العرض
      </span>
    </Link>
  );
}
