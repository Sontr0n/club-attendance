"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddMemberForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [slackUserId, setSlackUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, slackUserId: slackUserId || undefined }),
    });
    setPending(false);
    if (res.ok) {
      setName("");
      setEmail("");
      setSlackUserId("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Could not add member.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[2fr_2fr_1.5fr_auto]">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@school.edu"
        required
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <input
        value={slackUserId}
        onChange={(e) => setSlackUserId(e.target.value)}
        placeholder="Slack user ID (optional)"
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 sm:col-span-4">{error}</div>
      )}
    </form>
  );
}
