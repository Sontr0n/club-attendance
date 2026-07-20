import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  memberId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }
  const { memberId, password } = parsed.data;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  const now = new Date();
  // A meeting is "active" if now is between 1h before start and end+30min.
  const window = await prisma.event.findMany({
    where: {
      type: "MEETING",
      closedAt: null,
      startsAt: { lte: new Date(now.getTime() + 60 * 60 * 1000) },
      endsAt: { gte: new Date(now.getTime() - 30 * 60 * 1000) },
    },
  });

  const matched = window.find(
    (e) => e.secretPassword && e.secretPassword.trim().toLowerCase() === password.trim().toLowerCase()
  );

  if (!matched) {
    return NextResponse.json(
      { message: "No active meeting matches that password right now." },
      { status: 400 }
    );
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { memberId_eventId: { memberId, eventId: matched.id } },
  });

  if (existing) {
    if (existing.status === "PRESENT") {
      return NextResponse.json({ message: `Already marked present for ${matched.title}.` });
    }
    await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { status: "PRESENT", source: "PASSWORD" },
    });
  } else {
    await prisma.attendanceRecord.create({
      data: {
        memberId,
        eventId: matched.id,
        status: "PRESENT",
        source: "PASSWORD",
      },
    });
  }

  return NextResponse.json({ message: `You're marked present for ${matched.title}. Thanks!` });
}
