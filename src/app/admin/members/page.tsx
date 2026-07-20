import Link from "next/link";
import { prisma } from "@/lib/db";
import { AddMemberForm } from "./AddMemberForm";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { strikes: true, absenceRequests: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="mt-1 text-sm text-slate-500">
          {members.length} total. A member with 2 strikes must meet with the board.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Add member</h2>
        <div className="mt-3">
          <AddMemberForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Slack</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3">Strikes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.email}</td>
                <td className="px-4 py-3 text-slate-500">
                  {m.slackUserId ? (
                    <span className="font-mono text-xs">{m.slackUserId}</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{m._count.absenceRequests}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      m._count.strikes >= 2
                        ? "bg-red-100 text-red-700"
                        : m._count.strikes === 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m._count.strikes}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="text-sm text-slate-500 hover:text-slate-800"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No members yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
