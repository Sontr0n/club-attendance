"use client";

import { useState } from "react";

type Member = { id: string; name: string; email: string };

export function PresentForm({ members }: { members: Member[] }) {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/present", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId, password }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? "Marked present." : "Failed.") });
      if (res.ok) {
        setPassword("");
      }
    } catch {
      setResult({ ok: false, message: "Network error." });
    } finally {
      setPending(false);
    }
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
        <span className="text-sm font-medium text-slate-700">Secret password</span>
        <input
          type="text"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !memberId}
        className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Mark present"}
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
