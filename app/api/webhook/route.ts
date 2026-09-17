import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  contactInfoMessage,
  fallbackMessage,
  howToOrderMessage,
  sendMessage,
  welcomeMessageWithMenuButton,
  workingHoursMessage,
} from "@/lib/messenger-send-api";
import type {
  MessengerMessage,
  WebhookMessagingEvent,
  WebhookPayload,
} from "@/lib/messenger-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.VERIFY_TOKEN;
  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  try {
    const payload = JSON.parse(rawBody) as WebhookPayload;
    const entries = payload.entry ?? [];
    for (const entry of entries) {
      const events = entry.messaging ?? [];
      for (const event of events) {
        await handleEvent(event);
      }
    }
  } catch (err) {
    console.error("[webhook] processing error:", err);
  }

  return new Response("OK", { status: 200 });
}

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    console.error("[webhook] APP_SECRET not set");
    return false;
  }
  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected = signature.slice("sha256=".length);
  const computed = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const computedBuf = Buffer.from(computed, "hex");
  if (expectedBuf.length !== computedBuf.length) return false;
  return timingSafeEqual(expectedBuf, computedBuf);
}

async function handleEvent(event: WebhookMessagingEvent): Promise<void> {
  const psid = event.sender?.id;
  if (!psid) return;

  // ─── TEMPORARY: PSID capture for STAFF_PSID setup ───────────────────────
  // Logs every incoming sender id so the staff member's PSID can be identified
  // by sending any message to the Page and copying the printed `sender` value
  // into the STAFF_PSID env var. SAFE TO REMOVE once STAFF_PSID is captured
  // and set in the environment.
  console.log(
    "[PSID-CAPTURE] sender:",
    event.sender.id,
    "text:",
    event.message?.text
  );
  // ───────────────────────────────────────────────────────────────────────

  try {
    if (event.postback) {
      const payload = event.postback.payload;
      let reply: MessengerMessage;
      switch (payload) {
        case "CONTACT_INFO":
          reply = contactInfoMessage();
          break;
        case "START_ORDER":
          reply = howToOrderMessage();
          break;
        case "WORKING_HOURS":
          reply = workingHoursMessage();
          break;
        default:
          reply = welcomeMessageWithMenuButton();
      }
      const result = await sendMessage(psid, reply);
      if (!result.ok) {
        console.warn(
          "[webhook] postback send failed for",
          psid,
          ":",
          result.error
        );
      }
      return;
    }

    const rawText = event.message?.text;
    if (rawText) {
      const text = normalizeArabic(rawText);
      const reply =
        text.includes("كيفيه") || text.includes("طلب")
          ? howToOrderMessage()
          : fallbackMessage();
      const result = await sendMessage(psid, reply);
      if (!result.ok) {
        console.warn(
          "[webhook] message send failed for",
          psid,
          ":",
          result.error
        );
      }
    }
  } catch (err) {
    console.error("[webhook] event handler threw:", err);
  }
}

function normalizeArabic(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}
