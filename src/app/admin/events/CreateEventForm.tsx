"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"MEETING" | "SOCIAL">("MEETING");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        secretPassword: type === "MEETING" ? password || undefined : undefined,
      }),
    });
    setPending(false);
    if (res.ok) {
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setPassword("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Could not create event.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        required
        className="sm:col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "MEETING" | "SOCIAL")}
        className="sm:col-span-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      >
        <option value="MEETING">Meeting</option>
        <option value="SOCIAL">Social</option>
      </select>
      <input
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        required
        className="sm:col-span-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      />
      <input
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
        required
        className="sm:col-span-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-1 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Create"}
      </button>
      {type === "MEETING" && (
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Secret password (auto-generated if blank)"
          className="sm:col-span-6 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
      )}
      {error && (
        <div className="sm:col-span-6 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
    </form>
  );
}
