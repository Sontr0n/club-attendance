import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, makeAdminCookieValue } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { message: "Admin password not configured. Set ADMIN_PASSWORD in .env." },
      { status: 500 }
    );
  }
  if (password !== expected) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, makeAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
