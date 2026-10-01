import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ManualAttendance } from "./ManualAttendance";
import { CloseEventButton } from "./CloseEventButton";
import { EditPassword } from "./EditPassword";
import { attendanceDeadline, formatInClubTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    include: {
      attendance: {
        where: { eventId: event.id },
      },
      absenceRequests: {
        where: { eventId: event.id },
      },
    },
  });

  const rows = members.map((m) => ({
    id: m.id,
    name: m.name,
    record: m.attendance[0] ?? null,
    request: m.absenceRequests[0] ?? null,
  }));

  const now = new Date();
  const ended = event.endsAt < now;
  const deadline = attendanceDeadline(event);
  const checkInStillOpen = event.type === "MEETING" && now <= deadline;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {event.type} · {new Date(event.startsAt).toLocaleString()} – {new Date(event.endsAt).toLocaleString()}
          {event.closedAt && " · CLOSED"}
        </p>
        {event.type === "MEETING" && !event.closedAt && (
          <div className="mt-3 space-y-2">
            <EditPassword eventId={event.id} current={event.secretPassword} />
            <p className="text-xs text-slate-500">
              Members can check in until {formatInClubTime(deadline)}.
            </p>
          </div>
        )}
      </div>

      {ended && !event.closedAt && (
        <div
          className={`rounded-lg border p-4 ${
            checkInStillOpen ? "border-amber-300 bg-amber-50" : "border-violet-300 bg-violet-50"
          }`}
        >
          <div className={`font-medium ${checkInStillOpen ? "text-amber-900" : "text-violet-950"}`}>
            This event has ended.
          </div>
          {checkInStillOpen ? (
            <p className="mt-1 text-sm text-amber-800">
              Members can still check in until {formatInClubTime(deadline)}. Closing now would strike
              anyone who hasn&apos;t submitted yet — wait until after the deadline unless you mean to.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-700">
              Check-in closed at {formatInClubTime(deadline)}. Close the event to mark anyone with no
              record as an unexcused no-show and issue strikes.
            </p>
          )}
          <div className="mt-3">
            <CloseEventButton eventId={event.id} warnEarly={checkInStillOpen} />
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Attendance ({members.length} members)
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Set manually</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    {r.record ? (
                      <AttendancePill status={r.record.status} />
                    ) : r.request ? (
                      <span className="text-xs italic text-slate-500">
                        Absence request: {r.request.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No record</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.record?.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ManualAttendance
                      eventId={event.id}
                      memberId={r.id}
                      current={r.record?.status ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AttendancePill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Present", cls: "bg-emerald-100 text-emerald-700" },
    ABSENT_EXCUSED: { label: "Excused", cls: "bg-slate-100 text-slate-600" },
    ABSENT_UNEXCUSED: { label: "Unexcused", cls: "bg-red-100 text-red-700" },
  };
  const entry = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
}
