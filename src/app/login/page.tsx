import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold">Admin login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the admin password set in your <code className="rounded bg-slate-100 px-1">.env</code> file.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
