-- 20260917_restrict_orders_anon_insert.sql
--
-- Order creation now goes exclusively through app/api/orders/create/route.ts,
-- which uses the service-role client to recompute item prices and the
-- delivery fee server-side (from menu_items / delivery_zones) instead of
-- trusting the total the browser submits. The anon role no longer inserts
-- into `orders` directly, so its INSERT policy (`with_check: true`, i.e. no
-- constraints at all) is removed.
--
-- No SELECT/UPDATE/DELETE policy existed for anon on `orders` before this
-- change and none is added here — the create route returns the inserted row
-- directly in its JSON response, and /api/notify + the admin dashboard both
-- already use the service-role client, which bypasses RLS.

drop policy if exists "public insert orders" on public.orders;
