"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EventOption = { id: string; title: string; startsAt: string };

export function IssueStrikeForm({
  memberId,
  memberName,
  atCap,
  events,
}: {
  memberId: string;
  memberName: string;
  atCap: boolean;
  events: EventOption[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [eventId, setEventId] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (atCap) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
        {memberName} already has 2 strikes and must meet with the board. No further strikes can be
        issued.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Issue a strike to ${memberName}? They'll get a Slack DM about it.`)) return;
    setPending(true);
    setResult(null);
    const res = await fetch(`/api/admin/members/${memberId}/strike`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason, eventId: eventId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    setResult({ ok: res.ok, message: data.message ?? (res.ok ? "Strike issued." : "Failed.") });
    if (res.ok) {
      setReason("");
      setEventId("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={3}
          rows={2}
          placeholder="e.g. Left the social early without telling anyone"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Related event <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">No specific event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {new Date(ev.startsAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending || reason.trim().length < 3}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "Issuing…" : "Issue strike"}
      </button>

      {result && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </form>
  );
}
