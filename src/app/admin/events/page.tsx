import Link from "next/link";
import { prisma } from "@/lib/db";
import { SyncCalendarButton } from "./SyncCalendarButton";
import { CreateEventForm } from "./CreateEventForm";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { attendance: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-slate-500">
            Synced from Google Calendar. You can also create events manually.
          </p>
        </div>
        <SyncCalendarButton />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Create event manually</h2>
        <div className="mt-3">
          <CreateEventForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Records</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {e.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(e.startsAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {e.closedAt ? (
                    <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                      Closed
                    </span>
                  ) : new Date(e.endsAt) < new Date() ? (
                    <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      Needs close-out
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                      Open
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{e._count.attendance}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/events/${e.id}`} className="text-sm text-slate-500 hover:text-slate-800">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No events yet. Sync your Google Calendar above or create one manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
