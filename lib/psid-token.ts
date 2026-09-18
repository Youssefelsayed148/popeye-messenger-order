import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — long enough to browse the menu and check out

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Signs a PSID into an opaque, tamper-proof, expiring token that can be
 * safely embedded in a webview URL. Used in place of the (unreliable)
 * Messenger Extensions SDK getContext() call to identify the customer.
 */
export function signPsidToken(psid: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${psid}.${expiresAt}`;
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a token produced by signPsidToken(). Returns the PSID if the
 * signature is valid and the token hasn't expired, otherwise null.
 */
export function verifyPsidToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;

  let sigBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, "base64url");
    expectedBuf = Buffer.from(sign(encodedPayload), "base64url");
  } catch {
    return null;
  }
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const lastDot = payload.lastIndexOf(".");
  if (lastDot === -1) return null;
  const psid = payload.slice(0, lastDot);
  const expiresAt = Number(payload.slice(lastDot + 1));
  if (!psid || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return psid;
}
