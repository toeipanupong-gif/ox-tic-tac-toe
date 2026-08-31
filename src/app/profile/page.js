import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      games: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-slate-700" />
        )}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
            {user.name || "Player"}
          </h1>
          <p className="text-slate-400">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Score", user.score],
          ["Wins", user.wins],
          ["Losses", user.losses],
          ["Draws", user.draws],
          ["Win Rate", winRate(user.wins, user.losses, user.draws)],
          ["Win Streak", user.winStreak],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-4"
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Game History</h2>
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
