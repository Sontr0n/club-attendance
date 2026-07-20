import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "club_admin";

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-insecure-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function makeAdminCookieValue(): string {
  const issued = Date.now().toString();
  return `${issued}.${sign(issued)}`;
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!value) return false;
  const [issued, sig] = value.split(".");
  if (!issued || !sig) return false;
  const expected = sign(issued);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdmin(): boolean {
  const c = cookies().get(COOKIE_NAME)?.value;
  return isValidAdminCookie(c);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
