import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  secretPassword: z.string().min(1).max(100),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Password must be 1-100 characters." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });
  if (event.closedAt) {
    return NextResponse.json({ message: "Event is closed — password can't be changed." }, { status: 409 });
  }

  await prisma.event.update({
    where: { id: params.id },
    data: { secretPassword: parsed.data.secretPassword.trim() },
  });

  return NextResponse.json({ ok: true });
}
