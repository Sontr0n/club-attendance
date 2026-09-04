import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClearStrikeButton } from "./ClearStrikeButton";
import { IssueStrikeForm } from "./IssueStrikeForm";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    include: {
      strikes: { orderBy: { issuedAt: "desc" }, include: { event: true } },
      absenceRequests: { orderBy: { submittedAt: "desc" }, include: { event: true } },
      attendance: { orderBy: { createdAt: "desc" }, include: { event: true }, take: 50 },
    },
  });
  if (!member) notFound();

  const recentEvents = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    take: 25,
    select: { id: true, title: true, startsAt: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{member.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {member.email}
          {member.slackUserId && ` · Slack ${member.slackUserId}`}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Strikes ({member.strikes.length})
        </h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white">
          {member.strikes.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No strikes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {member.strikes.map((s) => (
                <li key={s.id} className="flex items-start justify-between p-4">
                  <div>
                    <div className="font-medium">
                      Strike #{s.number}{" "}
                      {s.number === 2 && (
                        <span className="ml-2 inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                          Must meet with board
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600">{s.reason}</div>
                    {s.event && (
                      <div className="text-xs text-slate-400">{s.event.title}</div>
                    )}
                    <div className="text-xs text-slate-400">{new Date(s.issuedAt).toLocaleString()}</div>
                  </div>
                  <ClearStrikeButton strikeId={s.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Issue a strike manually
        </h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <IssueStrikeForm
            memberId={member.id}
            memberName={member.name}
            atCap={member.strikes.length >= 2}
            events={recentEvents.map((e) => ({
              id: e.id,
              title: e.title,
              startsAt: e.startsAt.toISOString(),
            }))}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Absence requests ({member.absenceRequests.length})
        </h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white">
          {member.absenceRequests.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">None submitted.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {member.absenceRequests.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.event.title}</div>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Event: {new Date(r.event.startsAt).toLocaleString()} · Submitted{" "}
                    {new Date(r.submittedAt).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{r.reason}</div>
                  {r.adminNotes && (
                    <div className="mt-1 text-xs italic text-slate-500">Admin note: {r.adminNotes}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Attendance history
        </h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white">
          {member.attendance.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No attendance records yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {member.attendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{a.event.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(a.event.startsAt).toLocaleString()} · {a.event.type}
                    </div>
                  </div>
                  <AttendancePill status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    DENIED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
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
