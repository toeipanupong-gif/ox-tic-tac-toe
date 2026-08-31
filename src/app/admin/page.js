import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/admin/AdminPanel";
import { DIFFICULTIES } from "@/lib/game/difficulty";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, totalPlayers, stats, games] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.user.count(),
    prisma.userStat.findMany({
      select: {
        userId: true,
        difficulty: true,
        score: true,
        wins: true,
        losses: true,
        draws: true,
        winStreak: true,
      },
    }),
    prisma.game.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const usersByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const statByUser = Object.fromEntries(
        stats
          .filter((s) => s.difficulty === difficulty)
          .map((s) => [s.userId, s])
      );

      const usersWithStats = users
        .map((user) => {
          const s = statByUser[user.id];
          return {
            ...user,
            score: s?.score ?? 0,
            wins: s?.wins ?? 0,
            losses: s?.losses ?? 0,
            draws: s?.draws ?? 0,
            winStreak: s?.winStreak ?? 0,
          };
        })
        .sort((a, b) => b.score - a.score || b.wins - a.wins);

      return [difficulty, usersWithStats];
    })
  );

  const gamesByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [
      difficulty,
      games
        .filter((g) => g.difficulty === difficulty)
        .map((g) => ({
          id: g.id,
          result: g.result,
          scoreChange: g.scoreChange,
          bonusScore: g.bonusScore,
          winStreak: g.winStreak,
          createdAt: g.createdAt.toISOString(),
          user: g.user,
        })),
    ])
  );

  const totalGamesByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [
      difficulty,
      gamesByDifficulty[difficulty].length,
    ])
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-amber-300">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-300">ตรวจสอบผู้เล่น คะแนน และประวัติเกมตามระดับ Bot</p>
      </div>

      <AdminPanel
        usersByDifficulty={usersByDifficulty}
        totalGamesByDifficulty={totalGamesByDifficulty}
        totalPlayers={totalPlayers}
        gamesByDifficulty={gamesByDifficulty}
      />
    </section>
  );
}
