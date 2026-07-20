"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncCalendarButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/admin/calendar/sync", { method: "POST" });
    const data = await res.json();
    setMessage(data.message ?? (res.ok ? "Synced." : "Sync failed."));
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={sync}
        disabled={pending}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync Google Calendar"}
      </button>
      {message && <div className="mt-1 text-xs text-slate-500">{message}</div>}
    </div>
  );
}
