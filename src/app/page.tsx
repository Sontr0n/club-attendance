import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Club Attendance</h1>
      <p className="mt-3 text-slate-600">
        Submit attendance or request an absence below.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/present"
          className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <div className="text-lg font-semibold">I&apos;m at a meeting</div>
          <p className="mt-1 text-sm text-slate-600">
            Enter the secret password to be marked present.
          </p>
        </Link>

        <Link
          href="/absence"
          className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <div className="text-lg font-semibold">Request an absence</div>
          <p className="mt-1 text-sm text-slate-600">
            Submit at least 48 hours before the event.
          </p>
        </Link>
      </div>

      <div className="mt-12 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-slate-600">
          Admin →
        </Link>
      </div>
    </main>
  );
}
