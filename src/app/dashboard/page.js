import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  const stats = [
    ["Score", user.score, "text-cyan-300"],
    ["Streak", user.winStreak, "text-amber-300"],
    ["W", user.wins, "text-teal-300"],
    ["L", user.losses, "text-rose-300"],
    ["D", user.draws, "text-slate-200"],
  ];

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-teal-300 sm:text-5xl">
            OX Arena
          </h1>
          <p className="mt-2 text-slate-300">สวัสดี, {user.name || user.email}</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {stats.map(([label, value, color]) => (
            <div
              key={label}
              className="min-w-[4.25rem] scale-90 rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{label}</p>
              <p className={`mt-0.5 text-xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 py-10 text-center">
        <div className="play-mascot relative flex h-48 w-64 items-center justify-center" aria-hidden>
          <span className="play-mascot-x absolute left-0 top-0 font-[family-name:var(--font-display)] text-9xl font-extrabold text-teal-400">
            X
          </span>
          <span className="play-mascot-o absolute bottom-0 right-0 font-[family-name:var(--font-display)] text-9xl font-extrabold text-cyan-300">
            O
          </span>
        </div>

        <p className="max-w-sm text-lg text-slate-300">พร้อมวัดฝีมือบนกระดาน XO แล้วหรือยัง?</p>

        <Link href="/game" className="play-cta">
          เริ่มเล่นเกม
        </Link>
      </div>
    </section>
  );
}
