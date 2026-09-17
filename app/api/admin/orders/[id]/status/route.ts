import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type PatchBody = {
  status?: unknown;
};

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "cancelled"]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const nextStatus = typeof body.status === "string" ? body.status : null;
  if (!nextStatus || !ALLOWED_STATUSES.has(nextStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", id)
    .select(
      "id, psid, items, total, status, channel, customer_note, customer_name, phone, zone_name, delivery_fee, address, floor, apartment, landmark, payment_method, created_at"
    )
    .maybeSingle();

  if (error) {
    console.error("[admin/orders/status] update failed:", error.message);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: data });
}
