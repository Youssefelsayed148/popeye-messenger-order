import "server-only";
import type {
  AttachmentMessage,
  MessengerButton,
  MessengerMessage,
  SendApiErrorResponse,
  SendApiResponse,
  WebUrlButton,
} from "./messenger-types";
import type { Order } from "./types";
import { formatPrice } from "./format";

const GRAPH_API_VERSION = "v19.0";
const SEND_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

export type SendResult =
  | { ok: true; data: SendApiResponse | null }
  | { ok: false; error: string };

function requireWebviewBase(): string {
  const base = process.env.NEXT_PUBLIC_WEBVIEW_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_WEBVIEW_URL is not set");
  }
  return base.replace(/\/+$/, "");
}

export function menuWebUrlButton(): WebUrlButton {
  return {
    type: "web_url",
    url: `${requireWebviewBase()}/menu`,
    title: "افتح المنيو 🍗",
    messenger_extensions: true,
    webview_height_ratio: "full",
  };
}

export function welcomeMessageWithMenuButton(): MessengerMessage {
  const text =
    "أهلاً بيك في مطعم باباي 🍗\nاختار من المنيو أو اتصفح الأصناف";
  const buttons: MessengerButton[] = [menuWebUrlButton()];
  return buttonTemplateMessage(text, buttons);
}

export function howToOrderMessage(): MessengerMessage {
  const text =
    "🍗 اطلب في دقيقة واحدة!\n" +
    "1️⃣ دوس على الزرار تحت وافتح المنيو\n" +
    "2️⃣ اختار الأصناف اللي عايزها وضيفها للسلة\n" +
    "3️⃣ أدخل بياناتك (الاسم، العنوان، رقم الموبايل)\n" +
    "4️⃣ أكد الطلب — وهيوصلك تأكيد فوراً هنا في الشات";
  const buttons: MessengerButton[] = [menuWebUrlButton()];
  return buttonTemplateMessage(text, buttons);
}

export function contactInfoMessage(): MessengerMessage {
  const text =
    "اطلب دلوقتي على الواتساب أو رسايل الصفحة أو اتصل بنا الآن على الأرقام التالية 📞\n\n" +
    "035710277 - 035710276\n" +
    "01111470550 - 01212200338\n\n" +
    "📍 سيدي بشر بحري، 28 شارع 16 – جمال عبد الناصر";
  return { text };
}

export function workingHoursMessage(): MessengerMessage {
  const text = "🕐 مواعيد العمل\nكل يوم من الساعة 12 ضهراً لحد 2 بالليل";
  return { text };
}

export function fallbackMessage(): MessengerMessage {
  const text = "اكتب 'قائمة' عشان تشوف المنيو 🍗";
  const buttons: MessengerButton[] = [menuWebUrlButton()];
  return buttonTemplateMessage(text, buttons);
}

function paymentMethodLabel(order: Order): string {
  return order.payment_method === "instapay_vodafone"
    ? "💳 إنستاباي / فودافون كاش"
    : "💵 كاش عند الاستلام";
}

function fullAddress(order: Order): string {
  return [
    order.address,
    order.floor ? `الدور ${order.floor}` : null,
    order.apartment ? `شقة ${order.apartment}` : null,
    order.landmark,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("، ");
}

export function orderConfirmationMessage(order: Order): MessengerMessage {
  const lines: string[] = [
    "✅ تم استلام طلبك!",
    `رقم الطلب: ${order.id.slice(-8).toUpperCase()}`,
    "",
    ...order.items.map((i) => `• ${i.name} × ${i.qty}`),
    "",
    `الإجمالي: ${formatPrice(order.total)}`,
  ];

  const delivery = [order.zone_name, order.address]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" — ");
  if (delivery) {
    lines.push("", `📍 التوصيل: ${delivery}`);
  }

  lines.push("", `الدفع: ${paymentMethodLabel(order)}`);

  if (order.payment_method === "instapay_vodafone") {
    lines.push("متنساش تبعت لقطة شاشة للتحويل على واتساب 📸");
  }

  lines.push("", "شكراً لطلبك من مطعم باباي 🍗");
  return { text: lines.join("\n") };
}

export function staffOrderAlert(order: Order): MessengerMessage[] {
  const shortId = order.id.slice(-8).toUpperCase();
  const itemSummary = order.items
    .map((i) => `${i.name} × ${i.qty}`)
    .join("، ");

  const lines: string[] = [`🔴 طلب جديد! رقم ${shortId}`, ""];

  if (order.customer_name) {
    lines.push(`👤 الاسم: ${order.customer_name}`);
  }
  if (order.phone) {
    lines.push(`📞 الهاتف: ${order.phone}`);
  }

  const address = fullAddress(order);
  if (address) {
    lines.push(`📍 العنوان: ${address}`);
  }

  if (order.zone_name) {
    lines.push(
      `🛵 المنطقة: ${order.zone_name} — التوصيل ${formatPrice(
        order.delivery_fee ?? 0
      )}`
    );
  }

  lines.push(`الدفع: ${paymentMethodLabel(order)}`);

  if (order.payment_method === "instapay_vodafone") {
    lines.push("🔸 يحتاج مراجعة التحويل");
  }

  lines.push("", `🧾 ${itemSummary}`, `الإجمالي: ${formatPrice(order.total)}`);

  const dashboardUrl = `${requireWebviewBase()}/admin/orders`;
  const dashboardButton: WebUrlButton = {
    type: "web_url",
    url: dashboardUrl,
    title: "افتح لوحة الطلبات",
  };

  return [
    { text: lines.join("\n") },
    {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "افتح اللوحة لتأكيد الطلب",
          buttons: [dashboardButton],
        },
      },
    },
  ];
}

function buttonTemplateMessage(
  text: string,
  buttons: MessengerButton[]
): AttachmentMessage {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text,
        buttons,
      },
    },
  };
}

export async function sendMessage(
  psid: string,
  message: MessengerMessage
): Promise<SendResult> {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, error: "missing_page_access_token" };
  }

  let res: Response;
  try {
    res = await fetch(SEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipient: { id: psid }, message }),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "network_error",
    };
  }

  let data: SendApiResponse | SendApiErrorResponse | null = null;
  try {
    data = (await res.json()) as SendApiResponse | SendApiErrorResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const apiError =
      data && "error" in data ? data.error.message : `http_${res.status}`;
    return { ok: false, error: apiError };
  }

  return { ok: true, data: (data as SendApiResponse | null) ?? null };
}
