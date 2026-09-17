"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAnon } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import type { CartLine } from "@/lib/cart-context";
import { useMessengerContext } from "@/lib/messenger-context";
import { formatEgp } from "@/lib/format";
import type { DeliveryZone, Order } from "@/lib/types";

type CreateOrderSuccess = { ok: true; order: Order };
type CreateOrderError = { error: string; items?: string[] };
type CreateOrderResponse = CreateOrderSuccess | CreateOrderError;

const MAX_NOTE_LEN = 200;
const PHONE_REGEX = /^01[0125][0-9]{8}$/;
const PAYMENT_INSTAPAY = "instapay_vodafone";

type PaymentMethod = "cash" | "instapay_vodafone";

type FormState = {
  customer_name: string;
  phone: string;
  zoneId: string;
  address: string;
  floor: string;
  apartment: string;
  landmark: string;
  customer_note: string;
  payment_method: PaymentMethod;
};

const initialForm: FormState = {
  customer_name: "",
  phone: "",
  zoneId: "",
  address: "",
  floor: "",
  apartment: "",
  landmark: "",
  customer_note: "",
  payment_method: "cash",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isHydrated, clear, openCart } = useCart();
  const { psid, isMessengerContext, isReady } = useMessengerContext();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesError, setZonesError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instapayNumber = process.env.NEXT_PUBLIC_INSTAPAY_NUMBER ?? "";

  useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0) {
      openCart();
      router.replace("/menu");
      return;
    }
    if (isReady && !isMessengerContext) {
      openCart();
      router.replace("/menu");
    }
  }, [isHydrated, items.length, isReady, isMessengerContext, router, openCart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabaseAnon
        .from("delivery_zones")
        .select("*")
        .order("sort_order");

      if (cancelled) return;
      if (fetchError) {
        console.error(
          "[checkout] delivery_zones fetch failed:",
          fetchError.message
        );
        setZonesError(true);
        return;
      }
      setZones((data ?? []) as DeliveryZone[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedZone = useMemo(
    () => zones.find((z) => String(z.area_id) === form.zoneId) ?? null,
    [zones, form.zoneId]
  );
  const deliveryFee = selectedZone?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const lineTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of items) {
      map.set(l.item_id, l.price * l.qty);
    }
    return map;
  }, [items]);

  const guarded =
    !isHydrated || items.length === 0 || !isReady || !isMessengerContext;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (error) setError(null);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.customer_name.trim() || form.customer_name.trim().length < 2) {
      e.customer_name = "الاسم مطلوب";
    }
    if (!form.phone.trim()) {
      e.phone = "رقم الهاتف مطلوب";
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      e.phone = "رقم غير صحيح (مثال: 01XXXXXXXXX)";
    }
    if (!form.zoneId) {
      e.zoneId = "اختار منطقة التوصيل";
    }
    if (!form.address.trim() || form.address.trim().length < 10) {
      e.address = "أدخل عنوان مفصل (شارع، عقار، علامة مميزة)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (guarded || submitting || !psid) return;
    if (!validate() || !selectedZone) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      items: items.map((l) => ({ item_id: l.item_id, qty: l.qty })),
      zone_id: selectedZone.area_id,
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      floor: form.floor.trim() || null,
      apartment: form.apartment.trim() || null,
      landmark: form.landmark.trim() || null,
      customer_note: form.customer_note.trim() || null,
      payment_method: form.payment_method,
      psid,
    };

    let res: Response;
    try {
      res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[checkout] order create request failed:", err);
      setError("حصل خطأ، حاول تاني");
      setSubmitting(false);
      return;
    }

    let result: CreateOrderResponse | null = null;
    try {
      result = (await res.json()) as CreateOrderResponse;
    } catch {
      result = null;
    }

    if (!res.ok || !result || !("order" in result)) {
      setError(describeOrderError(result, items));
      setSubmitting(false);
      return;
    }

    const order = result.order;

    try {
      sessionStorage.setItem("last-order", JSON.stringify(order));
    } catch (err) {
      console.warn("[checkout] could not persist last-order:", err);
    }

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
      keepalive: true,
    }).catch((err) => console.warn("[notify] fire-and-forget failed:", err));

    clear();
    router.push(`/confirmation/${order.id}`);
  };

  if (guarded) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 px-4 pt-12">
        <div className="h-6 w-1/3 animate-pulse rounded bg-ink/5" />
        <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        <div className="h-12 animate-pulse rounded-full bg-ink/5" />
      </main>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border-2 bg-white px-4 py-3 font-sans text-sm text-ink placeholder:text-muted/60 transition focus:outline-none focus:ring-2 focus:ring-sauce/25 ${
      hasError ? "border-sauce" : "border-ink/10 focus:border-sauce"
    }`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-32 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">إتمام الطلب</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/menu")}
            className="font-sans text-sm text-muted underline-offset-2 hover:text-sauce hover:underline"
          >
            رجوع للمنيو
          </button>
          <button
            type="button"
            onClick={openCart}
            className="font-sans text-sm text-muted underline-offset-2 hover:text-sauce hover:underline"
          >
            عرض السلة
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-ink/10 bg-paper p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="customer-name"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              الاسم <span className="text-sauce">*</span>
            </label>
            <input
              id="customer-name"
              type="text"
              value={form.customer_name}
              onChange={(e) => updateField("customer_name", e.target.value)}
              placeholder="اسمك بالكامل"
              className={inputClass(!!errors.customer_name)}
            />
            {errors.customer_name && (
              <p className="mt-1 text-xs font-bold text-sauce">
                {errors.customer_name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              رقم الهاتف <span className="text-sauce">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              maxLength={11}
              value={form.phone}
              onChange={(e) =>
                updateField("phone", e.target.value.replace(/\D/g, ""))
              }
              placeholder="01XXXXXXXXX"
              className={`num-badge text-base ${inputClass(!!errors.phone)}`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-bold text-sauce">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="zone"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              منطقة التوصيل <span className="text-sauce">*</span>
            </label>
            <select
              id="zone"
              value={form.zoneId}
              onChange={(e) => updateField("zoneId", e.target.value)}
              className={inputClass(!!errors.zoneId)}
            >
              <option value="">اختار المنطقة</option>
              {zones.map((zone) => (
                <option key={zone.area_id} value={String(zone.area_id)}>
                  {zone.area_name} — {zone.delivery_fee} EGP
                </option>
              ))}
            </select>
            {zonesError && (
              <p className="mt-1 text-xs font-bold text-sauce">
                تعذر تحميل مناطق التوصيل، حاول تحديث الصفحة
              </p>
            )}
            {errors.zoneId && (
              <p className="mt-1 text-xs font-bold text-sauce">
                {errors.zoneId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              العنوان بالتفصيل <span className="text-sauce">*</span>
            </label>
            <textarea
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="الشارع، رقم العقار، علامة مميزة..."
              rows={3}
              className={`resize-none ${inputClass(!!errors.address)}`}
            />
            {errors.address && (
              <p className="mt-1 text-xs font-bold text-sauce">
                {errors.address}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="floor"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              الدور{" "}
              <span className="text-xs font-normal text-muted">(اختياري)</span>
            </label>
            <input
              id="floor"
              type="text"
              value={form.floor}
              onChange={(e) => updateField("floor", e.target.value)}
              placeholder="مثال: الدور الثالث"
              className={inputClass(false)}
            />
          </div>

          <div>
            <label
              htmlFor="apartment"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              الشقة{" "}
              <span className="text-xs font-normal text-muted">(اختياري)</span>
            </label>
            <input
              id="apartment"
              type="text"
              value={form.apartment}
              onChange={(e) => updateField("apartment", e.target.value)}
              placeholder="مثال: شقة 5"
              className={inputClass(false)}
            />
          </div>

          <div>
            <label
              htmlFor="landmark"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              علامة مميزة{" "}
              <span className="text-xs font-normal text-muted">(اختياري)</span>
            </label>
            <input
              id="landmark"
              type="text"
              value={form.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
              placeholder="مثال: بجوار صيدلية، اتصل عند الوصول..."
              className={inputClass(false)}
            />
          </div>

          <div>
            <label
              htmlFor="customer-note"
              className="mb-2 block font-sans text-sm font-bold text-ink"
            >
              ملاحظات{" "}
              <span className="text-xs font-normal text-muted">(اختياري)</span>
            </label>
            <textarea
              id="customer-note"
              value={form.customer_note}
              onChange={(e) =>
                updateField("customer_note", e.target.value.slice(0, MAX_NOTE_LEN))
              }
              maxLength={MAX_NOTE_LEN}
              rows={2}
              placeholder="مثلاً: من غير بصل، زيادة صوص…"
              className={`resize-none ${inputClass(false)}`}
            />
            <div className="mt-1 text-end font-sans text-xs text-muted">
              {form.customer_note.length}/{MAX_NOTE_LEN}
            </div>
          </div>

          <div>
            <span className="mb-2 block font-sans text-sm font-bold text-ink">
              طريقة الدفع
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField("payment_method", "cash")}
                className={`rounded-xl border-2 p-3 text-right transition ${
                  form.payment_method === "cash"
                    ? "border-sauce bg-sauce/5"
                    : "border-ink/10 bg-white hover:border-ink/30"
                }`}
              >
                <span aria-hidden className="mb-1 block text-lg">
                  💵
                </span>
                <span className="block font-sans text-sm font-black text-ink">
                  كاش
                </span>
                <span className="block text-[10px] text-muted">عند الاستلام</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("payment_method", PAYMENT_INSTAPAY)}
                className={`rounded-xl border-2 p-3 text-right transition ${
                  form.payment_method === PAYMENT_INSTAPAY
                    ? "border-sauce bg-sauce/5"
                    : "border-ink/10 bg-white hover:border-ink/30"
                }`}
              >
                <span aria-hidden className="mb-1 block text-lg">
                  💳
                </span>
                <span className="block font-sans text-sm font-black text-ink">
                  إنستاباي / فودافون كاش
                </span>
                <span className="block text-[10px] text-muted">
                  تحويل + لقطة شاشة
                </span>
              </button>
            </div>

            {form.payment_method === PAYMENT_INSTAPAY && (
              <div className="mt-3 rounded-xl border border-mustard/40 bg-mustard/10 p-3">
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
                  حوّل إجمالي الطلب على الرقم ده وابعت لقطة شاشة للتحويل على
                  واتساب.
                </p>
              </div>
            )}
          </div>
        </div>

        <section
          aria-label="ملخص الطلب"
          className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-white p-4"
        >
          <p className="mb-3 font-sans text-[10px] font-bold tracking-widest text-sauce">
            ملخص الطلب
          </p>
          <ul className="divide-y divide-ink/5">
            {items.map((line) => (
              <li key={line.item_id} className="flex items-start gap-3 py-3">
                <div className="flex-1">
                  <h3 className="font-sans text-sm font-semibold text-ink">
                    {line.name}
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-muted">
                    {line.qty} × {formatEgp(line.price)}
                  </p>
                </div>
                <span className="num-badge shrink-0 text-lg text-ink">
                  {formatEgp(lineTotals.get(line.item_id) ?? 0)}
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
              <span>
                التوصيل{" "}
                {selectedZone ? (
                  <span className="text-[10px]">({selectedZone.area_name})</span>
                ) : (
                  <span className="text-[10px] text-sauce">
                    — اختار المنطقة
                  </span>
                )}
              </span>
              <span className="num-badge">
                {selectedZone ? formatEgp(deliveryFee) : "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-2">
              <span className="font-black text-ink">الإجمالي</span>
              <span className="num-badge text-2xl font-black text-sauce">
                {formatEgp(total)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-sauce/40 bg-sauce/10 px-3 py-2 text-sm text-ink"
        >
          <span aria-hidden className="mt-0.5 text-sauce">
            !
          </span>
          <p>{error}</p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-cream/95 px-4 pb-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-cream/90">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-sauce px-5 font-sans text-base font-bold text-paper shadow-[0_8px_24px_rgba(220,31,38,0.35)] transition hover:bg-sauce-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {submitting ? (
              <>
                <Spinner />
                <span>بيتم التأكيد…</span>
              </>
            ) : (
              <span>تأكيد الطلب · {formatEgp(total)}</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function describeOrderError(
  result: CreateOrderResponse | null,
  cartItems: CartLine[]
): string {
  if (result && "error" in result) {
    if (result.error === "unavailable_items") {
      const names = (result.items ?? [])
        .map((id) => cartItems.find((l) => l.item_id === id)?.name)
        .filter((name): name is string => Boolean(name));
      return names.length > 0
        ? `الأصناف دي بقت غير متاحة: ${names.join("، ")} — شيلها من السلة وحاول تاني`
        : "بعض الأصناف في السلة بقت غير متاحة، حدّث السلة وحاول تاني";
    }
    if (result.error === "zone_not_found") {
      return "منطقة التوصيل دي غير متاحة، اختار منطقة تانية";
    }
  }
  return "حصل خطأ، حاول تاني";
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 animate-spin"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
