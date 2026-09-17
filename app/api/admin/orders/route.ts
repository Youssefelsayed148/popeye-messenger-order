import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, psid, items, total, status, channel, customer_note, customer_name, phone, zone_name, delivery_fee, address, floor, apartment, landmark, payment_method, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin/orders] fetch failed:", error.message);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: (data ?? []) as Order[] });
}
