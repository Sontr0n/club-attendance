"use client";

import { useState } from "react";

type Member = { id: string; name: string };
type Event = { id: string; title: string; startsAt: string; type: string };

export function AbsenceForm({ members, events }: { members: Member[]; events: Event[] }) {
  const [memberId, setMemberId] = useState("");
  const [eventId, setEventId] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/absence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId, eventId, reason }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? "Submitted." : "Failed.") });
      if (res.ok) {
        setReason("");
        setEventId("");
      }
    } catch {
      setResult({ ok: false, message: "Network error." });
    } finally {
      setPending(false);
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
        No upcoming events are scheduled yet. Check back later.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Your name</span>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">Select your name…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Event</span>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">Select event…</option>
          {events.map((e) => {
            const d = new Date(e.startsAt);
            const label = `${e.title} — ${d.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
            return (
              <option key={e.id} value={e.id}>
                {label}
              </option>
            );
          })}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          minLength={10}
          placeholder="Be specific — e.g. 'midterm the next morning', 'family emergency', 'sick with flu'"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !memberId || !eventId}
        className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit request"}
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
