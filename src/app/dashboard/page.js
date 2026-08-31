import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateAllStats } from "@/lib/game/stats";
import DashboardStats from "@/components/dashboard/DashboardStats";
import StartGameButton from "@/components/game/StartGameButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const statsByDifficulty = await getOrCreateAllStats(session.user.id);

  const serializable = Object.fromEntries(
    Object.entries(statsByDifficulty).map(([level, stat]) => [
      level,
      {
        score: stat.score,
        winStreak: stat.winStreak,
        wins: stat.wins,
        losses: stat.losses,
        draws: stat.draws,
      },
    ])
  );

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-teal-300 sm:text-5xl">
            OX Arena
          </h1>
          <p className="mt-2 text-slate-300">สวัสดี, {session.user.name || session.user.email}</p>
        </div>

        <DashboardStats statsByDifficulty={serializable} />
      </div>

      <div className="flex flex-col items-center justify-center gap-8 py-10 text-center">
        <div className="play-mascot relative flex h-48 w-64 items-center justify-center" aria-hidden>
          <span className="play-mascot-x absolute left-0 top-0 font-[family-name:var(--font-display)] text-9xl font-extrabold text-teal-400">
            O
          </span>
          <span className="play-mascot-o absolute bottom-0 right-0 font-[family-name:var(--font-display)] text-9xl font-extrabold text-cyan-300">
            X
          </span>
        </div>

        <p className="max-w-sm text-lg text-slate-300">พร้อมวัดฝีมือบนกระดาน OX แล้วหรือยัง?</p>

        <StartGameButton />
      </div>
    </section>
  );
}
