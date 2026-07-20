import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { issueStrike } from "@/lib/strikes";

const schema = z.object({
  decision: z.enum(["APPROVED", "DENIED"]),
  adminNotes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input." }, { status: 400 });

  const { decision, adminNotes } = parsed.data;

  const request = await prisma.absenceRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ message: "Already reviewed." }, { status: 409 });
  }

  await prisma.absenceRequest.update({
    where: { id: params.id },
    data: {
      status: decision,
      adminNotes,
      reviewedAt: new Date(),
    },
  });

  if (decision === "APPROVED") {
    await prisma.attendanceRecord.upsert({
      where: { memberId_eventId: { memberId: request.memberId, eventId: request.eventId } },
      create: {
        memberId: request.memberId,
        eventId: request.eventId,
        status: "ABSENT_EXCUSED",
        source: "APPROVED_ABSENCE",
      },
      update: { status: "ABSENT_EXCUSED", source: "APPROVED_ABSENCE" },
    });
  } else {
    await prisma.attendanceRecord.upsert({
      where: { memberId_eventId: { memberId: request.memberId, eventId: request.eventId } },
      create: {
        memberId: request.memberId,
        eventId: request.eventId,
        status: "ABSENT_UNEXCUSED",
        source: "APPROVED_ABSENCE",
      },
      update: { status: "ABSENT_UNEXCUSED" },
    });
    await issueStrike({
      memberId: request.memberId,
      eventId: request.eventId,
      reason: "Absence request denied",
    });
  }

  return NextResponse.json({ ok: true });
}
