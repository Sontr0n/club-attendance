import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { issueStrike } from "@/lib/strikes";

const schema = z.object({
  reason: z.string().trim().min(3, "Please give a reason."),
  eventId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const member = await prisma.member.findUnique({ where: { id: params.id } });
  if (!member) return NextResponse.json({ message: "Member not found." }, { status: 404 });

  const result = await issueStrike({
    memberId: params.id,
    eventId: parsed.data.eventId || null,
    reason: parsed.data.reason,
  });

  if (!result.issued) {
    return NextResponse.json(
      { message: `${member.name} already has 2 strikes — no further strikes are recorded.` },
      { status: 409 }
    );
  }

  const { strike, notify } = result;
  const notifyNote =
    notify.status === "sent"
      ? " Slack DM sent."
      : notify.status === "no_slack_id"
      ? " No Slack ID on file, so no DM was sent."
      : notify.status === "stubbed"
      ? " Slack is not configured, so no DM was sent."
      : ` Strike recorded, but the Slack DM failed (${notify.error}).`;

  return NextResponse.json({
    ok: true,
    number: strike.number,
    notify: notify.status,
    message: `Strike #${strike.number} issued to ${member.name}.${notifyNote}`,
  });
}
