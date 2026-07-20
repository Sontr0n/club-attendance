import { prisma } from "@/lib/db";
import { PresentForm } from "./PresentForm";

export const dynamic = "force-dynamic";

export default async function PresentPage() {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <a href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </a>
      <h1 className="mt-4 text-2xl font-bold">Mark yourself present</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the secret password shared at this meeting.
      </p>

      <div className="mt-6">
        <PresentForm members={members} />
      </div>
    </main>
  );
}
