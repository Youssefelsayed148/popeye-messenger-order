/**
 * scripts/seed-menu.ts
 *
 * Reads a JSON file of menu rows and upserts them into the `menu_items` table.
 *
 * Usage:
 *   tsx scripts/seed-menu.ts                  # reads ./menu-seed.json
 *   tsx scripts/seed-menu.ts ./my-menu.json   # reads a custom path
 *
 * ----------------------------------------------------------------------
 * IMPORTANT — RLS NOTE (read before running):
 * ----------------------------------------------------------------------
 * The `menu_items` table currently has RLS enabled with a SELECT-only policy
 * for the anon role. This means `supabaseAnon` CANNOT insert or upsert rows,
 * so running this script as-is will fail with a "new row violates row-level
 * security policy" error.
 *
 * You have two options to actually populate the menu:
 *
 *   (a) Temporarily run this script against the SERVICE_ROLE key locally:
 *         - Export SUPABASE_SERVICE_ROLE_KEY in your shell (NEVER commit it)
 *         - The script will pick it up and use a privileged client instead.
 *         - The anon key from .env.local is still required for URL resolution.
 *
 *   (b) Paste the seed data as raw SQL INSERT statements directly into the
 *       Supabase SQL Editor and run them there. This bypasses RLS entirely.
 *
 * This script is kept ready-to-go so once one of the above is decided, seeding
 * is a single command away.
 * ----------------------------------------------------------------------
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { MenuSeedRow } from "../lib/types";

loadEnv({ path: ".env.local" });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in environment."
  );
  process.exit(1);
}
if (!SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.");
  process.exit(1);
}

if (SERVICE_ROLE_KEY) {
  console.warn(
    "[seed-menu] SUPABASE_SERVICE_ROLE_KEY detected — using a privileged client.\n" +
      "          This bypasses RLS. Do NOT commit the service role key and do NOT\n" +
      "          ship it to the browser. Remove it from your shell when done."
  );
}

const client: SupabaseClient = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

if (!SERVICE_ROLE_KEY) {
  console.warn(
    "[seed-menu] No SUPABASE_SERVICE_ROLE_KEY found — upserting with the anon key.\n" +
      "          This will FAIL against the existing RLS policy (anon is SELECT-only).\n" +
      "          Either re-run with SUPABASE_SERVICE_ROLE_KEY set locally (never commit it),\n" +
      "          or paste the seed JSON as raw INSERT statements in the Supabase SQL Editor."
  );
}

const jsonPath = resolve(process.argv[2] ?? "./menu-seed.json");

let raw: string;
try {
  raw = readFileSync(jsonPath, "utf8");
} catch (err) {
  console.error(`Could not read seed file at ${jsonPath}:`, err);
  process.exit(1);
}

let rows: MenuSeedRow[];
try {
  rows = JSON.parse(raw) as MenuSeedRow[];
} catch (err) {
  console.error(`Seed file ${jsonPath} is not valid JSON:`, err);
  process.exit(1);
}

if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Seed file must be a non-empty JSON array of menu rows.");
  process.exit(1);
}

const normalized = rows.map((row) => ({
  category: row.category,
  name: row.name,
  description: row.description ?? null,
  price: row.price,
  image_url: row.image_url ?? null,
  sort_order: row.sort_order,
  is_available: true,
}));

const { data, error } = await client
  .from("menu_items")
  .upsert(normalized, { onConflict: "name" })
  .select("id, name");

if (error) {
  console.error("[seed-menu] Upsert failed:", error.message);
  process.exit(1);
}

console.log(
  `[seed-menu] Upserted ${data?.length ?? normalized.length} row(s) into menu_items.`
);
