import { prisma } from "@/lib/db";
import { AbsenceForm } from "./AbsenceForm";

export const dynamic = "force-dynamic";

export default async function AbsencePage() {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Only show upcoming events members can request absences for
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { startsAt: { gt: now }, closedAt: null },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, startsAt: true, type: true },
  });

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <a href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </a>
      <h1 className="mt-4 text-2xl font-bold">Request an absence</h1>
      <p className="mt-2 text-sm text-slate-600">
        Must be submitted at least <span className="font-medium">48 hours</span> before the event. Valid
        excuses only (family emergency, illness, midterm the next day). The admin reviews every request.
      </p>

      <div className="mt-6">
        <AbsenceForm
          members={members}
          events={events.map((e) => ({
            ...e,
            startsAt: e.startsAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
