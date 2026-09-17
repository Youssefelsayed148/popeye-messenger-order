-- 20260916_add_orders_checkout_fields.sql
--
-- Prompt 5 — extend the messenger `orders` table with the checkout fields
-- collected by the rebuilt checkout form (name, phone, delivery zone/fee,
-- address details, payment method).
--
-- Additive only: all new columns are nullable (or have defaults) and no
-- existing column is altered or dropped.
--
-- Pre-migration snapshot (2026-09-16):
--   orders row count: 0 (table empty — no data backup required)
--   existing columns: id, psid, items, total, status, channel,
--                     customer_note, created_at
--
-- RLS: the existing `public insert orders` policy for the anon role uses
-- WITH CHECK (true), so it already covers the new columns — no policy change
-- needed. Verified against pg_policies before applying.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS zone_name text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS floor text,
  ADD COLUMN IF NOT EXISTS apartment text,
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
