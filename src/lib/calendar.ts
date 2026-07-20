import { google, calendar_v3 } from "googleapis";
import { prisma } from "./db";

function getCredentials(): object | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON:", err);
    return null;
  }
}

function getCalendarClient(): calendar_v3.Calendar | null {
  const credentials = getCredentials();
  if (!credentials) return null;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  return google.calendar({ version: "v3", auth });
}

export type SyncResult = {
  ok: boolean;
  message: string;
  upserted: number;
};

function classifyEvent(title: string): "MEETING" | "SOCIAL" {
  const prefix = process.env.SOCIAL_EVENT_PREFIX ?? "[Social]";
  if (title.trim().toLowerCase().startsWith(prefix.toLowerCase())) return "SOCIAL";
  return "MEETING";
}

function randomPassword(): string {
  // Five lowercase words-ish — readable secret. Admin can override.
  const adjectives = ["bright", "quiet", "happy", "wild", "brave", "calm", "kind", "swift"];
  const nouns = ["river", "mountain", "forest", "comet", "harbor", "ember", "willow", "compass"];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}-${n}-${num}`;
}

export async function syncCalendarEvents(): Promise<SyncResult> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendar || !calendarId) {
    return {
      ok: false,
      message:
        "Calendar not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID in your env.",
      upserted: 0,
    };
  }

  const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days ago
  const timeMax = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(); // 90 days ahead

  let data;
  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });
    data = res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const apiMsg = err?.errors?.[0]?.message ?? err?.message ?? "Unknown error";
    if (status === 403 && apiMsg.includes("has not been used")) {
      return {
        ok: false,
        message: "Google Calendar API isn't enabled in your Google Cloud project. Enable it in the Cloud Console (link in the error) and try again.",
        upserted: 0,
      };
    }
    if (status === 404) {
      return {
        ok: false,
        message: `Calendar not found. Check that GOOGLE_CALENDAR_ID is correct and that the service account has been given access to the calendar.`,
        upserted: 0,
      };
    }
    return { ok: false, message: `Google API error (${status}): ${apiMsg}`, upserted: 0 };
  }

  let upserted = 0;
  for (const ev of data.items ?? []) {
    if (!ev.id || !ev.start?.dateTime || !ev.end?.dateTime || !ev.summary) continue;
    const type = classifyEvent(ev.summary);
    const startsAt = new Date(ev.start.dateTime);
    const endsAt = new Date(ev.end.dateTime);

    const existing = await prisma.event.findUnique({
      where: { googleCalendarEventId: ev.id },
    });

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: ev.summary,
          startsAt,
          endsAt,
          type,
        },
      });
    } else {
      await prisma.event.create({
        data: {
          title: ev.summary,
          startsAt,
          endsAt,
          type,
          secretPassword: type === "MEETING" ? randomPassword() : null,
          googleCalendarEventId: ev.id,
        },
      });
    }
    upserted++;
  }

  return { ok: true, message: `Synced ${upserted} event(s).`, upserted };
}
