import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "popeye_admin_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SIGNING_PAYLOAD_PREFIX = "popeye-admin-";

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error("APP_SECRET is not set");
  }
  return secret;
}

export function signAdminSession(timestamp: number = Date.now()): string {
  const ts = String(timestamp);
  const sig = createHmac("sha256", getSecret())
    .update(`${SIGNING_PAYLOAD_PREFIX}${ts}`)
    .digest("hex");
  return `${ts}.${sig}`;
}

export function verifyAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  if (Date.now() - tsNum > COOKIE_MAX_AGE_SECONDS * 1000) return false;

  const expected = createHmac("sha256", getSecret())
    .update(`${SIGNING_PAYLOAD_PREFIX}${ts}`)
    .digest("hex");

  const aBuf = Buffer.from(sig, "hex");
  const bBuf = Buffer.from(expected, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function isAdminAuthenticated(): boolean {
  const jar = cookies();
  const cookie = jar.get(ADMIN_COOKIE_NAME);
  return verifyAdminSession(cookie?.value);
}

export const adminCookieOptions = {
  name: ADMIN_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};
