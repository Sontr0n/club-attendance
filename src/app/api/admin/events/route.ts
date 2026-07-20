import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["MEETING", "SOCIAL"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  secretPassword: z.string().optional(),
});

function randomPassword(): string {
  const adjectives = ["bright", "quiet", "happy", "wild", "brave", "calm", "kind", "swift"];
  const nouns = ["river", "mountain", "forest", "comet", "harbor", "ember", "willow", "compass"];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}-${n}-${num}`;
}

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }

  const { title, type, startsAt, endsAt, secretPassword } = parsed.data;

  const event = await prisma.event.create({
    data: {
      title,
      type,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      secretPassword: type === "MEETING" ? secretPassword || randomPassword() : null,
    },
  });

  return NextResponse.json({ ok: true, event });
}
