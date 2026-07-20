"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const options = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT_EXCUSED", label: "Excused" },
  { value: "ABSENT_UNEXCUSED", label: "Unexcused" },
  { value: "CLEAR", label: "Clear" },
];

export function ManualAttendance({
  eventId,
  memberId,
  current,
}: {
  eventId: string;
  memberId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function set(status: string) {
    setPending(true);
    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, memberId, status }),
    });
    setPending(false);
    if (res.ok) router.refresh();
    else alert("Could not update.");
  }

  return (
    <select
      defaultValue={current ?? ""}
      disabled={pending}
      onChange={(e) => set(e.target.value)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
    >
      <option value="" disabled>
        {pending ? "Saving…" : "Set status…"}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
