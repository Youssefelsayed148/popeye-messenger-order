import "server-only";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { Order } from "@/lib/types";
import { OrdersDashboard } from "./OrdersDashboard";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin");
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, psid, items, total, status, channel, customer_note, customer_name, phone, zone_name, delivery_fee, address, floor, apartment, landmark, payment_method, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin/orders page] fetch failed:", error.message);
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-2 font-display text-2xl text-ink">
          حصل خطأ في تحميل الطلبات
        </h1>
        <p className="text-sm text-muted">حاول تاني بعد شوية</p>
      </main>
    );
  }

  const orders = (data ?? []) as Order[];

  return <OrdersDashboard initialOrders={orders} />;
}
