import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPsidToken } from "@/lib/psid-token";
import type { Offer, OfferItem, Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PAYMENT_METHODS = new Set(["cash", "instapay_vodafone"]);
const SANDWICH_CATEGORY_HINT = "ساندوتش";

type PlainCartLine = { kind: "item"; item_id: string; qty: number };
type OfferCartLine = {
  kind: "offer";
  offer_id: string;
  selections: string[];
  qty: number;
};
type CartLine = PlainCartLine | OfferCartLine;

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

  const plainLines = cartLines.filter(
    (l): l is PlainCartLine => l.kind === "item"
  );
  const offerLines = cartLines.filter(
    (l): l is OfferCartLine => l.kind === "offer"
  );

  const menuIds = new Set(plainLines.map((l) => l.item_id));
  for (const line of offerLines) {
    for (const sel of line.selections) menuIds.add(sel);
  }

  const { data: menuRows, error: menuError } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, category")
    .in("id", [...menuIds])
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
  const missingItems = plainLines
    .map((l) => l.item_id)
    .filter((id) => !menuById.has(id));
  if (missingItems.length > 0) {
    return NextResponse.json(
      { error: "unavailable_items", items: missingItems },
      { status: 400 }
    );
  }

  let offerById = new Map<string, Offer>();
  let offerItemsByOfferId = new Map<string, OfferItem[]>();
  if (offerLines.length > 0) {
    const offerIds = [...new Set(offerLines.map((l) => l.offer_id))];

    const { data: offerRows, error: offerError } = await supabaseAdmin
      .from("offers")
      .select("id, name, description, price, is_available, sort_order, created_at")
      .in("id", offerIds)
      .eq("is_available", true);

    if (offerError) {
      console.error("[orders/create] offers fetch failed:", offerError.message);
      return NextResponse.json({ error: "offer_lookup_failed" }, { status: 500 });
    }

    offerById = new Map((offerRows ?? []).map((row) => [row.id as string, row as Offer]));
    const missingOffers = offerIds.filter((id) => !offerById.has(id));
    if (missingOffers.length > 0) {
      return NextResponse.json(
        { error: "unavailable_offers", items: missingOffers },
        { status: 400 }
      );
    }

    const { data: offerItemRows, error: offerItemsError } = await supabaseAdmin
      .from("offer_items")
      .select(
        "id, offer_id, item_name, category_hint, quantity, is_selectable, is_free, item_price, sort_order"
      )
      .in("offer_id", offerIds)
      .order("sort_order", { ascending: true });

    if (offerItemsError) {
      console.error(
        "[orders/create] offer_items fetch failed:",
        offerItemsError.message
      );
      return NextResponse.json({ error: "offer_lookup_failed" }, { status: 500 });
    }

    for (const row of (offerItemRows ?? []) as OfferItem[]) {
      const list = offerItemsByOfferId.get(row.offer_id);
      if (list) list.push(row);
      else offerItemsByOfferId.set(row.offer_id, [row]);
    }
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

  const orderItems: OrderItem[] = [];
  for (const line of cartLines) {
    if (line.kind === "item") {
      const menuItem = menuById.get(line.item_id)!;
      orderItems.push({
        item_id: menuItem.id as string,
        name: menuItem.name as string,
        qty: line.qty,
        unit_price: menuItem.price as number,
      });
      continue;
    }

    const offer = offerById.get(line.offer_id)!;
    const offerItems = offerItemsByOfferId.get(offer.id) ?? [];

    const selectableSlots = offerItems.filter((oi) => oi.is_selectable);
    const totalSlots = selectableSlots.reduce((sum, oi) => sum + oi.quantity, 0);

    if (line.selections.length !== totalSlots) {
      return NextResponse.json(
        { error: "invalid_offer_selection", offer_id: offer.id },
        { status: 400 }
      );
    }

    let cursor = 0;
    let selectedTotal = 0;
    const selectedNames: string[] = [];
    for (const slot of selectableSlots) {
      for (let i = 0; i < slot.quantity; i++) {
        const selectionId = line.selections[cursor++];
        const menuItem = menuById.get(selectionId);
        const categoryOk = slot.category_hint
          ? menuItem?.category === slot.category_hint
          : (menuItem?.category as string | undefined)?.includes(
              SANDWICH_CATEGORY_HINT
            );
        if (!menuItem || !categoryOk) {
          return NextResponse.json(
            { error: "invalid_offer_selection", offer_id: offer.id },
            { status: 400 }
          );
        }
        selectedTotal += menuItem.price as number;
        selectedNames.push(menuItem.name as string);
      }
    }

    const includedTotal = offerItems
      .filter((oi) => !oi.is_selectable && !oi.is_free && oi.item_price != null)
      .reduce((sum, oi) => sum + (oi.item_price as number), 0);

    const unitPrice = offer.price != null ? offer.price : selectedTotal + includedTotal;
    const name =
      selectedNames.length > 0
        ? `${offer.name} (${selectedNames.join("، ")})`
        : offer.name;

    orderItems.push({
      item_id: offer.id,
      name,
      qty: line.qty,
      unit_price: unitPrice,
    });
  }

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
    const qty = typeof e.qty === "number" ? e.qty : Number(e.qty);
    if (!Number.isInteger(qty) || qty < 1) return null;

    if (typeof e.offer_id === "string" && e.offer_id) {
      if (!Array.isArray(e.selections)) return null;
      const selections = e.selections.filter(
        (s): s is string => typeof s === "string" && s.length > 0
      );
      if (selections.length !== e.selections.length) return null;
      out.push({ kind: "offer", offer_id: e.offer_id, selections, qty });
      continue;
    }

    if (typeof e.item_id !== "string" || !e.item_id) return null;
    out.push({ kind: "item", item_id: e.item_id, qty });
  }
  return out;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
