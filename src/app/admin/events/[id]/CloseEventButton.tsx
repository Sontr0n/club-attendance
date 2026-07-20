"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CloseEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function close() {
    if (
      !confirm(
        "Close this event? Any member with no attendance record and no approved absence will get a strike."
      )
    )
      return;
    setPending(true);
    const res = await fetch(`/api/admin/events/${eventId}/close`, { method: "POST" });
    const data = await res.json();
    setPending(false);
    if (res.ok) {
      alert(`Closed. ${data.noShows} no-show strike(s) issued.`);
      router.refresh();
    } else {
      alert(data.message ?? "Failed to close event.");
    }
  }

  return (
    <button
      onClick={close}
      disabled={pending}
      className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-amber-700 disabled:opacity-50"
    >
      {pending ? "Closing…" : "Close event & issue no-show strikes"}
    </button>
  );
}
