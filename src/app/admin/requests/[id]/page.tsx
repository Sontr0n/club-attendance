import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const request = await prisma.absenceRequest.findUnique({
    where: { id: params.id },
    include: {
      member: { include: { _count: { select: { strikes: true } } } },
      event: true,
    },
  });
  if (!request) notFound();

  const msUntil = request.event.startsAt.getTime() - request.submittedAt.getTime();
  const hoursAhead = msUntil / (1000 * 60 * 60);
  const onTime = hoursAhead >= 48;

  return (
    <div className="space-y-6">
      <a href="/admin/requests" className="text-sm text-slate-500 hover:text-slate-700">
        ← All requests
      </a>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{request.member.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {request.member.email} · {request.member._count.strikes} existing strike(s)
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
              request.status === "PENDING"
                ? "bg-amber-100 text-amber-700"
                : request.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {request.status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Event">{request.event.title} ({request.event.type})</Field>
          <Field label="Event time">{new Date(request.event.startsAt).toLocaleString()}</Field>
          <Field label="Submitted">{new Date(request.submittedAt).toLocaleString()}</Field>
          <Field label="Lead time">
            {hoursAhead.toFixed(1)} hours{" "}
            <span
              className={`ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                onTime ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              {onTime ? "On time" : "LATE"}
            </span>
          </Field>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</div>
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
            {request.reason}
          </div>
        </div>

        {request.adminNotes && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin notes</div>
            <div className="mt-2 text-sm italic text-slate-600">{request.adminNotes}</div>
          </div>
        )}
      </div>

      {request.status === "PENDING" && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Decision</h2>
          <p className="mt-1 text-xs text-slate-500">
            Approve = excused absence, no strike. Deny = unexcused absence, strike issued and member is notified on Slack.
          </p>
          <div className="mt-4">
            <ReviewForm requestId={request.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
}
