import "server-only";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  adminCookieOptions,
  signAdminSession,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type LoginBody = {
  password?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: LoginBody = {};
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const submitted = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    console.error("[admin-login] ADMIN_PASSWORD not set");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (!constantTimeEqual(submitted, expected)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const value = signAdminSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    ...adminCookieOptions,
    value,
  });
  return res;
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
