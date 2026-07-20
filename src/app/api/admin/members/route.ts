import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { lookupSlackUserByEmail } from "@/lib/slack";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  slackUserId: z.string().optional(),
});

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const { name, email, slackUserId } = parsed.data;

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "A member with that email already exists." }, { status: 409 });
  }

  // If no Slack ID was provided, try to look one up by email
  let resolvedSlackId = slackUserId ?? null;
  if (!resolvedSlackId) {
    resolvedSlackId = await lookupSlackUserByEmail(email);
  }

  const member = await prisma.member.create({
    data: { name, email, slackUserId: resolvedSlackId },
  });

  return NextResponse.json({ ok: true, member });
}
