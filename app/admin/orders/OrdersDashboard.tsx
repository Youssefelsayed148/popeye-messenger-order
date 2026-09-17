"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatEgp } from "@/lib/format";

const POLL_INTERVAL_MS = 30_000;
const POLL_URL = "/api/admin/orders";
const PATCH_URL = (id: string) => `/api/admin/orders/${id}/status`;

type Props = {
  initialOrders: Order[];
};

export function OrdersDashboard({ initialOrders }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [flashKey, setFlashKey] = useState(0);

  const seenIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const originalTitleRef = useRef<string>("");

  useEffect(() => {
    originalTitleRef.current = document.title;
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch {
      /* ignore — autoplay policy may block */
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(POLL_URL, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (!res.ok) return;

      const data = (await res.json()) as { ok: boolean; orders?: Order[] };
      const fetched = data.orders ?? [];
      const newIds = fetched.filter((o) => !seenIdsRef.current.has(o.id));

      for (const o of fetched) seenIdsRef.current.add(o.id);

      setOrders(fetched);

      if (newIds.length > 0) {
        playBeep();
        setFlashKey((k) => k + 1);
      }
    } catch (err) {
      console.warn("[dashboard] poll failed:", err);
    }
  }, [playBeep, router]);

  useEffect(() => {
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    if (flashKey === 0) return;
    const original = originalTitleRef.current || "لوحة الطلبات — باباي";
    const flashTitle = "🔴 طلب جديد!";
    let count = 0;
    const total = 6;
    const id = setInterval(() => {
      document.title = count % 2 === 0 ? flashTitle : original;
      count += 1;
      if (count >= total) {
        clearInterval(id);
        document.title = original;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [flashKey]);

  const handleConfirm = async (order: Order) => {
    if (confirmingIds.has(order.id) || order.status !== "pending") return;
    setConfirmingIds((prev) => new Set(prev).add(order.id));

    const previousStatus = order.status;
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: "confirmed" } : o))
    );

    try {
      const res = await fetch(PATCH_URL(order.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (!res.ok) throw new Error(`status_${res.status}`);
      const data = (await res.json()) as { order?: Order };
      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? data.order! : o))
        );
      } else {
        await poll();
      }
    } catch (err) {
      console.error("[dashboard] confirm failed:", err);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: previousStatus } : o
        )
      );
    } finally {
      setConfirmingIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-12 pt-6">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">لوحة الطلبات</h1>
          <p className="mt-1 text-sm text-muted">
            بيتحدث كل 30 ثانية — الطلب الجديد بينبهك بصوت وإشعار
          </p>
        </div>
        <span className="font-sans text-sm text-muted">
          {orders.length} طلب
        </span>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-paper p-8 text-center">
          <p className="font-sans text-sm text-muted">
            مفيش طلبات لسه. استنى أول طلب من المنيو.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              confirming={confirmingIds.has(order.id)}
              onConfirm={handleConfirm}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function OrderCard({
  order,
  confirming,
  onConfirm,
}: {
  order: Order;
  confirming: boolean;
  onConfirm: (o: Order) => void;
}) {
  const summary = summarizeItems(order.items);
  const addressLine = formatAddress(order);
  const isInstapay = order.payment_method === "instapay_vodafone";

  return (
    <li className="rounded-2xl border border-ink/10 bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num-badge text-base tracking-wider text-sauce">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
            {isInstapay && (
              <span className="rounded-full border border-mustard/40 bg-mustard/20 px-2.5 py-0.5 font-sans text-[11px] font-bold text-mustard-dark">
                🔸 يحتاج مراجعة التحويل
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 font-sans text-sm text-ink-soft">
            {summary}
          </p>

          <div className="mt-2 space-y-0.5 font-sans text-xs text-muted">
            {order.customer_name && (
              <p className="font-bold text-ink">👤 {order.customer_name}</p>
            )}
            {order.phone && (
              <p>
                📞{" "}
                <a
                  href={`tel:${order.phone}`}
                  dir="ltr"
                  className="num-badge font-bold text-sauce hover:underline"
                >
                  {order.phone}
                </a>
              </p>
            )}
            {order.zone_name && (
              <p>
                🛵 {order.zone_name} —{" "}
                <span className="num-badge">
                  {formatEgp(order.delivery_fee ?? 0)}
                </span>
              </p>
            )}
            {addressLine && <p>📍 {addressLine}</p>}
            <p>
              {isInstapay
                ? "💳 إنستاباي / فودافون كاش"
                : "💵 كاش عند الاستلام"}
            </p>
            {order.customer_note && <p>📝 {order.customer_note}</p>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="num-badge text-xl text-sauce">
            {formatEgp(order.total)}
          </span>
          <RelativeTime iso={order.created_at} />
          {order.status === "pending" && (
            <button
              type="button"
              disabled={confirming}
              onClick={() => onConfirm(order)}
              className="flex h-10 items-center rounded-full bg-sauce px-4 font-sans text-sm font-bold text-paper transition hover:bg-sauce-dark active:scale-95 disabled:opacity-60"
            >
              {confirming ? "بنأكد…" : "تأكيد"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="rounded-full border border-sauce/30 bg-sauce/10 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-sauce">
        مؤكد
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-ink-soft">
        ملغي
      </span>
    );
  }
  return (
    <span className="rounded-full border border-mustard/40 bg-mustard/20 px-2.5 py-0.5 font-sans text-[11px] font-semibold text-mustard-dark">
      جديد
    </span>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(force, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <time
      dateTime={iso}
      suppressHydrationWarning
      className="font-sans text-xs text-muted"
    >
      {formatRelativeTime(iso)}
    </time>
  );
}

function formatAddress(order: Order): string {
  const parts = [
    order.address,
    order.floor ? `الدور ${order.floor}` : null,
    order.apartment ? `شقة ${order.apartment}` : null,
    order.landmark,
  ].filter((p): p is string => Boolean(p && p.trim()));
  return parts.join(" — ");
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "دلوقتي";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "دلوقتي";
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} ساعة`;
  const day = Math.floor(hr / 24);
  return `منذ ${day} يوم`;
}

function summarizeItems(items: Order["items"]): string {
  if (items.length === 0) return "—";
  const MAX = 3;
  const head = items
    .slice(0, MAX)
    .map((i) => `${i.name} × ${i.qty}`)
    .join("، ");
  if (items.length > MAX) {
    const rest = items.length - MAX;
    return `${head}، و${rest} صنف تاني`;
  }
  return head;
}
