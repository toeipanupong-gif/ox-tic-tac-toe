import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      games: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-300">สวัสดี, {user.name || user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Score", user.score, "text-cyan-300"],
          ["Win Streak", user.winStreak, "text-amber-300"],
          ["Wins", user.wins, "text-teal-300"],
          ["Losses", user.losses, "text-rose-300"],
          ["Draws", user.draws, "text-slate-200"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-4"
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/game"
          className="rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 hover:bg-teal-300"
        >
          Play Game
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-xl border border-slate-600 px-5 py-3 text-slate-200 hover:border-teal-400 hover:text-teal-300"
        >
          Leaderboard
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Games</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Score Δ</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {user.games.map((game) => (
                <tr key={game.id} className="border-t border-slate-800/80">
                  <td className="px-4 py-3">{game.result}</td>
                  <td className="px-4 py-3">{game.scoreChange}</td>
                  <td className="px-4 py-3">{game.bonusScore}</td>
                  <td className="px-4 py-3">{game.winStreak}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(game.createdAt).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
              {user.games.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีประวัติเกม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
