import { prisma } from "./db";
import { issueStrike } from "./strikes";

/**
 * Closes out an event: any member who has no AttendanceRecord and no APPROVED
 * absence is marked AUTO_NO_SHOW and issued a strike.
 */
export async function closeEvent(
  eventId: string
): Promise<{ noShows: number; notifyFailures: string[] }> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (event.closedAt) return { noShows: 0, notifyFailures: [] };

  const members = await prisma.member.findMany();
  let noShows = 0;
  const notifyFailures: string[] = [];

  for (const member of members) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { memberId_eventId: { memberId: member.id, eventId } },
    });
    if (record) continue;

    await prisma.attendanceRecord.create({
      data: {
        memberId: member.id,
        eventId,
        status: "ABSENT_UNEXCUSED",
        source: "AUTO_NO_SHOW",
      },
    });

    const result = await issueStrike({
      memberId: member.id,
      eventId,
      reason: "Did not attend and did not submit absence form",
    });

    if (result.issued && result.notify.status !== "sent") {
      notifyFailures.push(member.name);
    }

    noShows++;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { closedAt: new Date() },
  });

  return { noShows, notifyFailures };
}
