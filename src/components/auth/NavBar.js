import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";

  return (
    <header className="border-b border-slate-700/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-xl tracking-wide text-teal-300">
          OX Arena
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Link href="/dashboard" className="hover:text-teal-300">
            Dashboard
          </Link>
          <Link href="/game" className="hover:text-teal-300">
            Play
          </Link>
          <Link href="/leaderboard" className="hover:text-teal-300">
            Leaderboard
          </Link>
          <Link href="/profile" className="hover:text-teal-300">
            Profile
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-amber-300">
              Admin
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-600 px-3 py-1.5 hover:border-rose-400 hover:text-rose-300"
            >
              Logout
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
