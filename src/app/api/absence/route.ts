import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueStrike } from "@/lib/strikes";

const schema = z.object({
  memberId: z.string().min(1),
  eventId: z.string().min(1),
  reason: z.string().min(10, "Please provide a fuller explanation."),
});

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { memberId, eventId, reason } = parsed.data;

  const [member, event] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.event.findUnique({ where: { id: eventId } }),
  ]);

  if (!member || !event) {
    return NextResponse.json({ message: "Member or event not found." }, { status: 404 });
  }

  const existing = await prisma.absenceRequest.findUnique({
    where: { memberId_eventId: { memberId, eventId } },
  });
  if (existing) {
    return NextResponse.json(
      { message: "You've already submitted a request for this event." },
      { status: 409 }
    );
  }

  const msUntil = event.startsAt.getTime() - Date.now();

  // Late submission — auto-deny and issue strike.
  if (msUntil < FORTY_EIGHT_HOURS_MS) {
    await prisma.absenceRequest.create({
      data: {
        memberId,
        eventId,
        reason,
        status: "DENIED",
        adminNotes: "Auto-denied: submitted less than 48 hours before event.",
        reviewedAt: new Date(),
      },
    });
    await prisma.attendanceRecord.upsert({
      where: { memberId_eventId: { memberId, eventId } },
      create: {
        memberId,
        eventId,
        status: "ABSENT_UNEXCUSED",
        source: "APPROVED_ABSENCE", // we still mark it; "source" is informational
      },
      update: { status: "ABSENT_UNEXCUSED" },
    });
    await issueStrike({
      memberId,
      eventId,
      reason: "Late absence request (less than 48 hours)",
    });

    return NextResponse.json(
      {
        message:
          "This request was submitted less than 48 hours before the event, so it was automatically denied. A strike has been issued per club rules.",
      },
      { status: 200 }
    );
  }

  await prisma.absenceRequest.create({
    data: {
      memberId,
      eventId,
      reason,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    message: "Submitted. The admin will review your request shortly.",
  });
}
