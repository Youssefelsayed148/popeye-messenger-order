import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  orderConfirmationMessage,
  sendMessage,
  staffOrderAlert,
} from "@/lib/messenger-send-api";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

type NotifyBody = {
  orderId?: unknown;
  psid?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: NotifyBody = {};
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : null;
  const psid = typeof body.psid === "string" ? body.psid : null;

  if (!orderId || !psid) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 }
    );
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select(
      "id, psid, items, total, status, channel, customer_note, customer_name, phone, zone_name, delivery_fee, address, floor, apartment, landmark, payment_method, created_at"
    )
    .eq("id", orderId)
    .maybeSingle<Order>();

  if (fetchError) {
    console.error("[notify] order fetch failed:", fetchError.message);
    return NextResponse.json(
      { ok: false, error: "order_fetch_failed" },
      { status: 500 }
    );
  }

  if (!order) {
    console.error("[notify] order not found:", orderId);
    return NextResponse.json(
      { ok: false, error: "order_not_found" },
      { status: 500 }
    );
  }

  const result = await sendMessage(psid, orderConfirmationMessage(order));

  if (!result.ok) {
    console.error(
      "[notify] sendMessage failed for order",
      orderId,
      ":",
      result.error
    );
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 }
    );
  }

  // Staff alert — independent of customer confirmation. Skipped silently when
  // STAFF_PSID isn't set yet (pre-capture). Failures here must NOT affect the
  // response or the customer confirmation that already succeeded above.
  const staffPsid = process.env.STAFF_PSID?.trim();
  if (staffPsid) {
    try {
      for (const msg of staffOrderAlert(order)) {
        const staffResult = await sendMessage(staffPsid, msg);
        if (!staffResult.ok) {
          console.warn(
            "[notify] staff alert send failed for order",
            orderId,
            ":",
            staffResult.error
          );
        }
      }
    } catch (err) {
      console.warn("[notify] staff alert threw:", err);
    }
  }

  return NextResponse.json({ ok: true, sent: true, message: result.data });
}
