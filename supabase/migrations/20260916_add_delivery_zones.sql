-- 20260916_add_delivery_zones.sql
--
-- Mirror of the website project's delivery_zones table into the messenger
-- project so the Messenger checkout can read zones with the anon client
-- (Prompt 4). Source: dyvjpxbfixpodjhlopnf.delivery_zones (39 rows).
-- Shape matches the website exactly: area_id, area_name, delivery_fee,
-- sort_order (+ updated_at). Re-runnable / idempotent.
--
-- NOTE: no sync mechanism exists yet — if zones change on the website side,
-- re-run the upsert below (or build a sync job).

create table if not exists public.delivery_zones (
  area_id integer primary key,
  area_name text not null,
  delivery_fee numeric not null default 0,
  sort_order integer,
  updated_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;

drop policy if exists "public read delivery zones" on public.delivery_zones;
create policy "public read delivery zones"
  on public.delivery_zones for select to anon using (true);

grant select on public.delivery_zones to anon;
grant all on public.delivery_zones to authenticated;
grant all on public.delivery_zones to service_role;

insert into public.delivery_zones (area_id, area_name, delivery_fee, sort_order)
values
  (1, 'سيدي بشر بحري', 15, 1),
  (2, 'فيكتوريا', 15, 2),
  (3, 'ميامي', 15, 3),
  (4, 'الساعة', 20, 4),
  (5, 'السيوف', 20, 5),
  (6, 'السيوف ترام', 20, 6),
  (7, 'العصافرة', 20, 7),
  (8, 'المندرة', 20, 8),
  (9, 'ثروت', 20, 9),
  (10, 'جناكليس', 20, 10),
  (11, 'زيزينيا', 20, 11),
  (12, 'سان ستفانو', 20, 12),
  (13, 'سيدي بشر قبلي', 20, 13),
  (14, 'لوران', 20, 14),
  (15, 'السيوف شماعة', 25, 15),
  (16, 'باكوس', 25, 16),
  (17, 'جليم', 25, 17),
  (18, 'العوايد', 30, 18),
  (19, 'الفلكي', 30, 19),
  (20, 'المعمورة', 30, 20),
  (21, 'المنتزة', 30, 21),
  (22, 'بولكلي', 30, 22),
  (23, 'رشدى', 30, 23),
  (24, 'سابا باشا', 30, 24),
  (25, 'فلمنج', 30, 25),
  (26, 'المعمورة البلد', 35, 26),
  (27, 'الملاحة', 35, 27),
  (28, 'سبورتنج', 35, 28),
  (29, 'سموحة', 35, 29),
  (30, 'سيدى جابر', 35, 30),
  (31, 'كليوباترا', 35, 31),
  (32, 'مصطفى كامل', 35, 32),
  (33, 'ابو قير', 40, 33),
  (34, 'الابراهيمية', 40, 34),
  (35, 'الشاطبي', 40, 35),
  (36, 'كامب شيزار', 40, 36),
  (37, 'محرم بك', 40, 37),
  (38, 'المنشية', 45, 38),
  (39, 'محطة الرمل', 45, 39)
on conflict (area_id) do update
  set area_name = excluded.area_name,
      delivery_fee = excluded.delivery_fee,
      sort_order = excluded.sort_order,
      updated_at = now();
