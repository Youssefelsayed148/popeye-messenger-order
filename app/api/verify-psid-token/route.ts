import "server-only";
import { NextResponse } from "next/server";
import { verifyPsidToken } from "@/lib/psid-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: { token?: unknown } = {};
  try {
    body = (await request.json()) as { token?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const psid = verifyPsidToken(token);
  if (!psid) {
    return NextResponse.json(
      { ok: false, error: "invalid_or_expired_token" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, psid });
}
