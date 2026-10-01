import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center gap-4">
        <Image src="/logo.png" alt="CCG logo" width={64} height={64} priority className="rounded-xl" />
        <h1 className="text-4xl font-bold tracking-tight text-violet-950">CCG Attendance</h1>
      </div>
      <p className="mt-4 text-slate-600">
        Submit attendance or request an absence below.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/present"
          className="block rounded-xl border border-violet-100 bg-violet-50/50 p-6 shadow-sm transition hover:border-violet-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-violet-950">I&apos;m at a meeting</div>
          <p className="mt-1 text-sm text-slate-600">
            Enter the secret password to be marked present. Open until midnight the night of the
            event.
          </p>
        </Link>

        <Link
          href="/absence"
          className="block rounded-xl border border-violet-100 bg-violet-50/50 p-6 shadow-sm transition hover:border-violet-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-violet-950">Request an absence</div>
          <p className="mt-1 text-sm text-slate-600">
            Submit at least 48 hours before the event.
          </p>
        </Link>
      </div>

      <div className="mt-12 text-xs text-slate-400">
        <Link href="/admin" className="hover:text-violet-700">
          Admin →
        </Link>
      </div>
    </main>
  );
}
