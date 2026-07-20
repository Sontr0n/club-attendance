import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  eventId: z.string().min(1),
  memberId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT_EXCUSED", "ABSENT_UNEXCUSED", "CLEAR"]),
});

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 });
  }
  const { eventId, memberId, status } = parsed.data;

  if (status === "CLEAR") {
    await prisma.attendanceRecord.deleteMany({ where: { eventId, memberId } });
    return NextResponse.json({ ok: true });
  }

  await prisma.attendanceRecord.upsert({
    where: { memberId_eventId: { memberId, eventId } },
    create: { eventId, memberId, status, source: "ADMIN_MANUAL" },
    update: { status, source: "ADMIN_MANUAL" },
  });

  return NextResponse.json({ ok: true });
}
