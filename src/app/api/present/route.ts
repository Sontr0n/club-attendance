import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { attendanceDeadline } from "@/lib/time";

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
  // Check-in opens 1h before a meeting starts and stays open until midnight the
  // night of the event. The 3-day lower bound just keeps the query small; the
  // real cutoff is attendanceDeadline(), which is timezone-aware.
  const candidates = await prisma.event.findMany({
    where: {
      type: "MEETING",
      closedAt: null,
      startsAt: {
        lte: new Date(now.getTime() + 60 * 60 * 1000),
        gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const open = candidates.filter((e) => now <= attendanceDeadline(e));

  const matched = open.find(
    (e) => e.secretPassword && e.secretPassword.trim().toLowerCase() === password.trim().toLowerCase()
  );

  if (!matched) {
    // Distinguish "right password, too late" from "wrong password" so members
    // who miss the deadline get an answer they can act on.
    const expired = candidates.find(
      (e) =>
        e.secretPassword &&
        e.secretPassword.trim().toLowerCase() === password.trim().toLowerCase()
    );
    if (expired) {
      return NextResponse.json(
        {
          message: `Check-in for ${expired.title} closed at midnight on the night of the event. Submit an absence form or talk to the board.`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "No open meeting matches that password right now." },
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
