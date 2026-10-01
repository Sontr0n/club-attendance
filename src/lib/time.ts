/**
 * Date helpers that work in the club's local timezone rather than the server's.
 *
 * This matters in production: Vercel runs in UTC, so a 7pm Pacific meeting is
 * stored as 02:00 UTC the following day. Computing "end of the event's day" in
 * server time would give members almost a full extra day to check in.
 */

const DEFAULT_TIME_ZONE = "America/Los_Angeles";

export function clubTimeZone(): string {
  return process.env.CLUB_TIMEZONE || DEFAULT_TIME_ZONE;
}

type WallClock = { y: number; mo: number; d: number; h: number; mi: number; s: number };

/** The wall-clock reading an observer in `timeZone` sees at instant `date`. */
function wallClockIn(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    y: read("year"),
    mo: read("month"),
    d: read("day"),
    h: read("hour"),
    mi: read("minute"),
    s: read("second"),
  };
}

/** The UTC instant at which `timeZone` reads the given wall-clock time. */
function wallClockToInstant(wall: WallClock, timeZone: string): Date {
  // Treat the wall time as if it were UTC, then correct by however far off that
  // guess lands when read back in the target zone.
  const guess = Date.UTC(wall.y, wall.mo - 1, wall.d, wall.h, wall.mi, wall.s);
  const seen = wallClockIn(new Date(guess), timeZone);
  const seenAsUtc = Date.UTC(seen.y, seen.mo - 1, seen.d, seen.h, seen.mi, seen.s);
  return new Date(guess - (seenAsUtc - guess));
}

/**
 * Midnight at the end of `date`'s calendar day in `timeZone` — i.e. 00:00 on the
 * following day. An event on Monday evening gets a deadline of Tuesday 00:00.
 */
export function midnightAfter(date: Date, timeZone: string = clubTimeZone()): Date {
  const { y, mo, d } = wallClockIn(date, timeZone);
  // Step to the next calendar day using UTC arithmetic on the date parts only,
  // which sidesteps month/year rollover by hand.
  const nextDay = new Date(Date.UTC(y, mo - 1, d) + 24 * 60 * 60 * 1000);
  return wallClockToInstant(
    {
      y: nextDay.getUTCFullYear(),
      mo: nextDay.getUTCMonth() + 1,
      d: nextDay.getUTCDate(),
      h: 0,
      mi: 0,
      s: 0,
    },
    timeZone
  );
}

/**
 * How long members have to check in for an event: until midnight the night of
 * the event. Never earlier than the event's own end, so a meeting that runs
 * past midnight still accepts check-ins while it is happening.
 */
export function attendanceDeadline(event: { startsAt: Date; endsAt: Date }): Date {
  const midnight = midnightAfter(event.startsAt);
  return event.endsAt > midnight ? event.endsAt : midnight;
}

/** Formats an instant as a short wall-clock string in the club's timezone. */
export function formatInClubTime(date: Date, timeZone: string = clubTimeZone()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
