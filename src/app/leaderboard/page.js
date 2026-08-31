import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaderboardView from "@/components/leaderboard/LeaderboardView";
import { DIFFICULTIES } from "@/lib/game/difficulty";
import { sortPlayersByRank } from "@/lib/game/stats";

export default async function LeaderboardPage() {
  const session = await auth();

  const stats = await prisma.userStat.findMany({
    where: {
      user: { role: "USER" },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  const rankedByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const levelStats = stats.filter((s) => s.difficulty === difficulty);
      const ranked = sortPlayersByRank(
        levelStats.map((s) => ({
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
          score: s.score,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
        }))
      );
      return [difficulty, ranked];
    })
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
          Leaderboard
        </h1>
        <p className="mt-2 text-slate-300">
          จัดอันดับคะแนนตามระดับ
        </p>
      </div>

      <LeaderboardView
        rankedByDifficulty={rankedByDifficulty}
        currentUserId={session?.user?.id ?? null}
      />
    </section>
  );
}
