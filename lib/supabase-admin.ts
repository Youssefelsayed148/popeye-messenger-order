import "server-only";

/**
 * Server-only Supabase client that bypasses Row Level Security.
 *
 * SECURITY: This module uses SUPABASE_SERVICE_ROLE_KEY, which has full
 * database access. The `server-only` import above throws at build time if
 * anything in the client bundle tries to import it. Never import this file
 * (directly or transitively) from any `"use client"` component or module
 * that ends up in a client bundle.
 *
 * Use cases in this project:
 *   - app/api/notify/route.ts → reading orders to send the confirmation message.
 *   - scripts/seed-menu.ts → seeding menu rows (uses its own dotenv-loaded env).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!serviceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
