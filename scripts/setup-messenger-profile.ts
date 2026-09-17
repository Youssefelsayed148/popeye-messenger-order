/**
 * scripts/setup-messenger-profile.ts
 *
 * One-off script to register the Messenger persistent menu and ice breakers
 * for the Page via the Messenger Profile API.
 *
 * Usage:
 *   npx tsx scripts/setup-messenger-profile.ts
 *
 * Requires PAGE_ACCESS_TOKEN to be set (in .env.local or the shell env).
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const GRAPH_API_VERSION = "v19.0";
const MESSENGER_PROFILE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messenger_profile`;

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

if (!PAGE_ACCESS_TOKEN) {
  console.error("Missing PAGE_ACCESS_TOKEN in environment.");
  process.exit(1);
}

async function main(): Promise<void> {
  const profile = {
    get_started: { payload: "GET_STARTED" },
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [
          { type: "postback", title: "📋 المنيو والطلب", payload: "START_ORDER" },
          { type: "postback", title: "📞 الأرقام والعنوان", payload: "CONTACT_INFO" },
          { type: "postback", title: "🕐 مواعيد العمل", payload: "WORKING_HOURS" },
        ],
      },
    ],
    ice_breakers: [
      { question: "📋 المنيو والطلب", payload: "START_ORDER" },
      { question: "📞 الأرقام والعنوان", payload: "CONTACT_INFO" },
      { question: "🕐 مواعيد العمل", payload: "WORKING_HOURS" },
    ],
  };

  const res = await fetch(MESSENGER_PROFILE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(profile),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[setup-messenger-profile] Request failed:", data);
    process.exit(1);
  }

  console.log("[setup-messenger-profile] Response:", data);
}

main();
