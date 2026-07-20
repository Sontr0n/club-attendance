import { prisma } from "./db";
import { sendStrikeNotification } from "./slack";

export type StrikeReason =
  | "Late absence request (less than 48 hours)"
  | "Absence request denied"
  | "Did not attend and did not submit absence form"
  | string;

export async function issueStrike(params: {
  memberId: string;
  eventId?: string | null;
  reason: StrikeReason;
}) {
  const { memberId, eventId, reason } = params;

  const existing = await prisma.strike.count({ where: { memberId } });
  if (existing >= 2) {
    // Already at the cap — record nothing new; admin handles offline.
    return null;
  }

  const number = existing + 1;
  const strike = await prisma.strike.create({
    data: {
      memberId,
      eventId: eventId ?? null,
      reason,
      number,
    },
  });

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (member?.slackUserId) {
    await sendStrikeNotification({
      slackUserId: member.slackUserId,
      memberName: member.name,
      strikeNumber: number,
      reason,
    }).catch((err) => {
      console.error("Slack notification failed:", err);
    });
  }

  return strike;
}
