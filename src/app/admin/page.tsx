import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();

  const [pendingRequests, memberCount, upcomingEvents, recentStrikes, twoStrikers] = await Promise.all([
    prisma.absenceRequest.findMany({
      where: { status: "PENDING" },
      include: { member: true, event: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.member.count(),
    prisma.event.findMany({
      where: { startsAt: { gte: now }, closedAt: null },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.strike.findMany({
      orderBy: { issuedAt: "desc" },
      include: { member: true },
      take: 5,
    }),
    prisma.member.findMany({
      include: { _count: { select: { strikes: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const atRisk = twoStrikers.filter((m) => m._count.strikes >= 2);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-4">
        <Card label="Pending requests" value={pendingRequests.length} accent={pendingRequests.length > 0 ? "amber" : "slate"} />
        <Card label="Members" value={memberCount} />
        <Card label="Upcoming events" value={upcomingEvents.length} />
        <Card label="At 2 strikes" value={atRisk.length} accent={atRisk.length > 0 ? "red" : "slate"} />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pending absence requests</h2>
          <Link href="/admin/requests" className="text-sm text-slate-500 hover:text-slate-800">
            View all →
          </Link>
        </div>
        {pendingRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing to review.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {pendingRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{r.member.name}</div>
                  <div className="text-sm text-slate-500">
                    {r.event.title} — {new Date(r.event.startsAt).toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-slate-700">{r.reason}</div>
                </div>
                <Link
                  href={`/admin/requests/${r.id}`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming events</h2>
          <Link href="/admin/events" className="text-sm text-slate-500 hover:text-slate-800">
            View all →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No upcoming events. Sync your calendar from Events.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {upcomingEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">
                    {e.title}{" "}
                    <span className="ml-2 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                      {e.type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">{new Date(e.startsAt).toLocaleString()}</div>
                </div>
                <Link
                  href={`/admin/events/${e.id}`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent strikes</h2>
        {recentStrikes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No strikes issued yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {recentStrikes.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">
                    {s.member.name}{" "}
                    <span
                      className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                        s.number === 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      Strike #{s.number}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">{s.reason}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(s.issuedAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    slate: "bg-white",
    amber: "bg-amber-50",
    red: "bg-red-50",
  };
  return (
    <div className={`rounded-lg border border-slate-200 p-4 ${colors[accent]}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}
