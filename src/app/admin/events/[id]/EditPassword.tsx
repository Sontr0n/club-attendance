"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditPassword({
  eventId,
  current,
}: {
  eventId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Password can't be empty.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secretPassword: trimmed }),
    });
    setPending(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Could not save.");
    }
  }

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50/50 px-3 py-2 text-sm">
        <span className="text-slate-500">Secret password:</span>
        <span className="font-mono font-semibold text-violet-950">{current ?? "(none)"}</span>
        <button
          onClick={() => {
            setValue(current ?? "");
            setEditing(true);
          }}
          className="ml-1 text-xs text-violet-600 hover:text-violet-800"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={pending}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
      {error && <div className="text-xs text-red-700">{error}</div>}
    </div>
  );
}
