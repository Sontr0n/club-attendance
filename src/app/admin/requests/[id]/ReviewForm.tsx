"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);

  async function decide(decision: "APPROVED" | "DENIED") {
    setPending(decision === "APPROVED" ? "approve" : "deny");
    const res = await fetch(`/api/admin/requests/${requestId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, adminNotes: notes || undefined }),
    });
    setPending(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? "Failed.");
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Optional notes (e.g. why you denied, or context)"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <div className="flex gap-3">
        <button
          onClick={() => decide("APPROVED")}
          disabled={pending !== null}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending === "approve" ? "Approving…" : "Approve absence"}
        </button>
        <button
          onClick={() => decide("DENIED")}
          disabled={pending !== null}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-50"
        >
          {pending === "deny" ? "Denying…" : "Deny & issue strike"}
        </button>
      </div>
    </div>
  );
}
