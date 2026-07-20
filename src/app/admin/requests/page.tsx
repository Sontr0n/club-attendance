import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await prisma.absenceRequest.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: { member: true, event: true },
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Absence requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending review</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Inbox zero.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {pending.map((r) => (
              <li key={r.id} className="flex items-start justify-between p-4">
                <div>
                  <div className="font-medium">
                    {r.member.name}{" "}
                    <span className="text-sm font-normal text-slate-500">— {r.event.title}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Event {new Date(r.event.startsAt).toLocaleString()} · submitted{" "}
                    {new Date(r.submittedAt).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{r.reason}</div>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reviewed</h2>
        {reviewed.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No reviewed requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {reviewed.map((r) => (
              <li key={r.id} className="flex items-start justify-between p-4">
                <div>
                  <div className="font-medium">
                    {r.member.name}{" "}
                    <span className="text-sm font-normal text-slate-500">— {r.event.title}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Reviewed {r.reviewedAt && new Date(r.reviewedAt).toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-slate-700 line-clamp-2">{r.reason}</div>
                </div>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                    r.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
