import { isAdmin } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) {
    redirect("/login");
  }

  let pendingCount = 0;
  try {
    pendingCount = await prisma.absenceRequest.count({ where: { status: "PENDING" } });
  } catch (err) {
    console.error("Failed to load pending request count:", err);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold text-violet-950">
              <Image src="/logo.png" alt="CCG logo" width={28} height={28} className="rounded-md" />
              CCG Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/admin" className="hover:text-violet-700">
                Dashboard
              </Link>
              <Link href="/admin/requests" className="hover:text-violet-700">
                Requests
                {pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/admin/members" className="hover:text-violet-700">
                Members
              </Link>
              <Link href="/admin/events" className="hover:text-violet-700">
                Events
              </Link>
            </nav>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="text-sm text-slate-500 hover:text-slate-700">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
