import { WebClient } from "@slack/web-api";

function getClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || token.startsWith("xoxb-...") || token === "") return null;
  return new WebClient(token);
}

export async function sendStrikeNotification(params: {
  slackUserId: string;
  memberName: string;
  strikeNumber: number;
  reason: string;
}) {
  const client = getClient();
  const { slackUserId, memberName, strikeNumber, reason } = params;

  const body =
    strikeNumber === 1
      ? `Hi ${memberName} — this is a notice that you've received your *first strike* in the club.\n\n*Reason:* ${reason}\n\nThis strike is a warning. One more strike and you will be required to meet with the board to discuss your commitment to the club.`
      : `Hi ${memberName} — you have received your *second strike*.\n\n*Reason:* ${reason}\n\nPer club rules, you are required to meet with the board to discuss your continued commitment to the club. Please reach out to a board member to schedule this meeting.`;

  if (!client) {
    console.log(
      `[slack:stub] would DM ${slackUserId} (${memberName}) — strike #${strikeNumber}: ${reason}`
    );
    return;
  }

  await client.chat.postMessage({
    channel: slackUserId,
    text: body,
  });
}

export async function lookupSlackUserByEmail(email: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await client.users.lookupByEmail({ email });
    return res.user?.id ?? null;
  } catch {
    return null;
  }
}
