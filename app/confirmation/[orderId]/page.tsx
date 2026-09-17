"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatEgp } from "@/lib/format";

const STORAGE_KEY = "last-order";

function isValidOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.psid === "string" &&
    Array.isArray(v.items) &&
    typeof v.total === "number" &&
    typeof v.status === "string" &&
    typeof v.channel === "string" &&
    (typeof v.customer_note === "string" || v.customer_note === null) &&
    typeof v.created_at === "string"
  );
}

function shortOrderNumber(id: string): string {
  return id.slice(-8).toUpperCase();
}

export default function ConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const urlOrderId = typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  const instapayNumber = process.env.NEXT_PUBLIC_INSTAPAY_NUMBER ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!stored) {
      setOrder(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (isValidOrder(parsed) && parsed.id === urlOrderId) {
        setOrder(parsed);
      } else {
        setOrder(null);
      }
    } catch {
      setOrder(null);
    }
  }, [urlOrderId]);

  const handleBackToMenu = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.push("/menu");
  };

  if (order === undefined) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6">
        <div
          aria-hidden
          className="mb-6 h-24 w-24 animate-pulse rounded-full bg-ink/5"
        />
        <div className="h-5 w-40 animate-pulse rounded bg-ink/5" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <SuccessBadge />
        <h1 className="mt-6 font-display text-3xl text-ink">تم استلام طلبك</h1>
        <p className="mt-3 max-w-xs text-sm text-muted">
          هيتم التواصل معاك على ماسنجر قريب.
        </p>
        <button
          type="button"
          onClick={handleBackToMenu}
          className="mt-8 inline-flex h-12 items-center rounded-full bg-sauce px-6 font-sans text-sm font-bold text-paper transition hover:bg-sauce-dark active:scale-95"
        >
          رجوع للمنيو
        </button>
      </main>
    );
  }

  const subtotal = order.items.reduce(
    (sum, l) => sum + l.qty * l.unit_price,
    0
  );
  const deliveryFee = order.delivery_fee ?? 0;
  const total = order.total ?? subtotal + deliveryFee;
  const isInstapay = order.payment_method === "instapay_vodafone";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-16 pt-10">
      <div className="flex flex-col items-center text-center">
        <SuccessBadge />
        <h1 className="mt-6 font-display text-3xl text-ink">تم استلام طلبك</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          رقم الطلب:{" "}
          <span className="num-badge text-base tracking-wider text-sauce">
            {shortOrderNumber(order.id)}
          </span>
        </p>
      </div>

      <section
        aria-label="تفاصيل الطلب"
        className="mt-8 rounded-2xl border border-ink/10 bg-paper p-4"
      >
        <div className="space-y-2 border-b border-ink/10 pb-4">
          <DetailRow label="الاسم" value={order.customer_name ?? "—"} />
          <DetailRow
            label="الهاتف"
            value={order.phone ?? "—"}
            ltr={Boolean(order.phone)}
          />
          <DetailRow
            label="منطقة التوصيل"
            value={
              order.zone_name
                ? `${order.zone_name} (${formatEgp(deliveryFee)})`
                : "—"
            }
          />
          <DetailRow label="العنوان" value={order.address ?? "—"} />
          {order.floor && <DetailRow label="الدور" value={order.floor} />}
          {order.apartment && (
            <DetailRow label="الشقة" value={order.apartment} />
          )}
          {order.landmark && (
            <DetailRow label="علامة مميزة" value={order.landmark} />
          )}
          <DetailRow
            label="طريقة الدفع"
            value={isInstapay ? "إنستاباي / فودافون كاش" : "كاش عند الاستلام"}
          />
        </div>

        <ul className="divide-y divide-ink/5">
          {order.items.map((line) => (
            <li
              key={`${order.id}-${line.item_id}`}
              className="flex items-start gap-3 py-3"
            >
              <div className="flex-1">
                <h3 className="font-sans text-sm font-semibold text-ink">
                  {line.name}
                </h3>
                <p className="mt-0.5 font-sans text-xs text-muted">
                  {line.qty} × {formatEgp(line.unit_price)}
                </p>
              </div>
              <span className="num-badge shrink-0 text-lg text-ink">
                {formatEgp(line.qty * line.unit_price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex items-baseline justify-between text-muted">
            <span>المجموع الجزئي</span>
            <span className="num-badge">{formatEgp(subtotal)}</span>
          </div>
          <div className="flex items-baseline justify-between text-muted">
            <span>التوصيل</span>
            <span className="num-badge">{formatEgp(deliveryFee)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-ink/10 pt-2">
            <span className="font-black text-ink">الإجمالي</span>
            <span className="num-badge text-2xl font-black text-sauce">
              {formatEgp(total)}
            </span>
          </div>
        </div>

        {order.customer_note && (
          <div className="mt-3 rounded-xl bg-ink/5 p-3">
            <p className="font-sans text-xs text-muted">ملاحظتك</p>
            <p className="mt-1 font-sans text-sm text-ink-soft">
              {order.customer_note}
            </p>
          </div>
        )}
      </section>

      {isInstapay && (
        <section className="mt-4 rounded-xl border border-mustard/40 bg-mustard/10 p-3">
          <p className="font-sans text-sm font-bold text-ink">
            حوّل إجمالي الطلب على الرقم ده:
          </p>
          <p
            dir="ltr"
            className="num-badge mt-1 text-lg font-black tracking-wider text-sauce"
          >
            {instapayNumber || "—"}
          </p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-ink-soft">
            متنساش تبعت لقطة شاشة للتحويل على واتساب عشان نأكد طلبك.
          </p>
        </section>
      )}

      <p className="mt-6 text-center font-sans text-sm text-muted">
        هيتم التواصل معاك على ماسنجر قريب
      </p>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleBackToMenu}
          className="inline-flex h-12 items-center rounded-full bg-sauce px-6 font-sans text-sm font-bold text-paper transition hover:bg-sauce-dark active:scale-95"
        >
          رجوع للمنيو
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <Link
          href="/menu"
          className="font-sans text-xs text-muted underline-offset-2 hover:text-sauce hover:underline"
        >
          أو تابع التصفح
        </Link>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span
        dir={ltr ? "ltr" : undefined}
        className={`text-left font-semibold text-ink-soft ${ltr ? "num-badge" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function SuccessBadge() {
  return (
    <div
      aria-hidden
      className="relative flex h-28 w-28 items-center justify-center rounded-full bg-sauce shadow-[0_12px_40px_rgba(220,31,38,0.3)]"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25) 0%, transparent 55%)",
        }}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative h-14 w-14 text-paper"
        aria-hidden
      >
        <path d="M4 12l5 5L20 6" />
      </svg>
    </div>
  );
}
