import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPsidToken } from "@/lib/psid-token";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PAYMENT_METHODS = new Set(["cash", "instapay_vodafone"]);

type CartLine = { item_id: string; qty: number };

type CreateOrderBody = {
  items?: unknown;
  zone_id?: unknown;
  customer_name?: unknown;
  phone?: unknown;
  address?: unknown;
  floor?: unknown;
  apartment?: unknown;
  landmark?: unknown;
  customer_note?: unknown;
  payment_method?: unknown;
  t?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: CreateOrderBody = {};
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const cartLines = parseCartItems(body.items);
  if (!cartLines || cartLines.length === 0) {
    return NextResponse.json({ error: "missing_items" }, { status: 400 });
  }

  const zoneId =
    typeof body.zone_id === "number" ? body.zone_id : Number(body.zone_id);
  if (!Number.isInteger(zoneId)) {
    return NextResponse.json({ error: "missing_zone" }, { status: 400 });
  }

  const token = typeof body.t === "string" ? body.t : "";
  const psid = token ? verifyPsidToken(token) : null;
  if (!psid) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const customerName =
    typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (!customerName || !phone || !address) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const floor = optionalString(body.floor);
  const apartment = optionalString(body.apartment);
  const landmark = optionalString(body.landmark);
  const customerNote = optionalString(body.customer_note);
  const paymentMethod =
    typeof body.payment_method === "string" &&
    ALLOWED_PAYMENT_METHODS.has(body.payment_method)
      ? body.payment_method
      : "cash";

  const ids = [...new Set(cartLines.map((l) => l.item_id))];

  const { data: menuRows, error: menuError } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price")
    .in("id", ids)
    .eq("is_available", true);

  if (menuError) {
    console.error(
      "[orders/create] menu_items fetch failed:",
      menuError.message
    );
    return NextResponse.json({ error: "menu_lookup_failed" }, { status: 500 });
  }

  const menuById = new Map(
    (menuRows ?? []).map((row) => [row.id as string, row])
  );
  const missing = ids.filter((id) => !menuById.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "unavailable_items", items: missing },
      { status: 400 }
    );
  }

  const { data: zone, error: zoneError } = await supabaseAdmin
    .from("delivery_zones")
    .select("area_id, area_name, delivery_fee")
    .eq("area_id", zoneId)
    .maybeSingle();

  if (zoneError) {
    console.error(
      "[orders/create] delivery_zones fetch failed:",
      zoneError.message
    );
    return NextResponse.json({ error: "zone_lookup_failed" }, { status: 500 });
  }
  if (!zone) {
    return NextResponse.json({ error: "zone_not_found" }, { status: 404 });
  }

  const orderItems: OrderItem[] = cartLines.map((line) => {
    const menuItem = menuById.get(line.item_id)!;
    return {
      item_id: menuItem.id as string,
      name: menuItem.name as string,
      qty: line.qty,
      unit_price: menuItem.price as number,
    };
  });

  const subtotal = orderItems.reduce((sum, l) => sum + l.qty * l.unit_price, 0);
  const deliveryFee = zone.delivery_fee as number;
  const total = subtotal + deliveryFee;

  const { data: order, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      psid,
      items: orderItems,
      total,
      status: "pending",
      channel: "messenger",
      customer_note: customerNote,
      customer_name: customerName,
      phone,
      zone_name: zone.area_name as string,
      delivery_fee: deliveryFee,
      address,
      floor,
      apartment,
      landmark,
      payment_method: paymentMethod,
    })
    .select(
      "id, psid, items, total, status, channel, customer_note, customer_name, phone, zone_name, delivery_fee, address, floor, apartment, landmark, payment_method, created_at"
    )
    .single<Order>();

  if (insertError || !order) {
    console.error("[orders/create] insert failed:", insertError?.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order });
}

function parseCartItems(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw)) return null;
  const out: CartLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.item_id !== "string" || !e.item_id) return null;
    const qty = typeof e.qty === "number" ? e.qty : Number(e.qty);
    if (!Number.isInteger(qty) || qty < 1) return null;
    out.push({ item_id: e.item_id, qty });
  }
  return out;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
