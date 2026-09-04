import { prisma } from "./db";
import { sendStrikeNotification } from "./slack";

export type StrikeReason =
  | "Late absence request (less than 48 hours)"
  | "Absence request denied"
  | "Did not attend and did not submit absence form"
  | string;

export type NotifyResult =
  | { status: "sent" }
  | { status: "no_slack_id" }
  | { status: "stubbed" }
  | { status: "failed"; error: string };

export type IssueStrikeResult =
  | { issued: false; reason: "at_cap" }
  | {
      issued: true;
      strike: { id: string; number: number };
      notify: NotifyResult;
    };

export async function issueStrike(params: {
  memberId: string;
  eventId?: string | null;
  reason: StrikeReason;
}): Promise<IssueStrikeResult> {
  const { memberId, eventId, reason } = params;

  const existing = await prisma.strike.count({ where: { memberId } });
  if (existing >= 2) {
    // Already at the cap — record nothing new; admin handles offline.
    return { issued: false, reason: "at_cap" };
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

  let notify: NotifyResult;
  if (!member?.slackUserId) {
    notify = { status: "no_slack_id" };
  } else {
    try {
      notify = await sendStrikeNotification({
        slackUserId: member.slackUserId,
        memberName: member.name,
        strikeNumber: number,
        reason,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Slack notification failed:", err);
      notify = { status: "failed", error: message };
    }
  }

  return { issued: true, strike: { id: strike.id, number }, notify };
}
