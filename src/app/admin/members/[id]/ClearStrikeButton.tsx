"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClearStrikeButton({ strikeId }: { strikeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function clear() {
    if (!confirm("Remove this strike? This cannot be undone.")) return;
    setPending(true);
    const res = await fetch(`/api/admin/strikes/${strikeId}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) router.refresh();
    else alert("Failed to remove strike.");
  }

  return (
    <button
      onClick={clear}
      disabled={pending}
      className="text-xs text-slate-500 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
