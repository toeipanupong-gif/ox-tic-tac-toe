import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/admin/AdminPanel";
import DifficultyTabs from "@/components/ui/DifficultyTabs";
import { normalizeDifficulty } from "@/lib/game/difficulty";

export default async function AdminPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const difficulty = normalizeDifficulty(params?.difficulty);

  const [users, totalGames, totalPlayers, stats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.game.count({ where: { difficulty } }),
    prisma.user.count(),
    prisma.userStat.findMany({
      where: { difficulty },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  const statByUser = Object.fromEntries(stats.map((s) => [s.userId, s]));

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

  const recentGames = await prisma.game.findMany({
    where: { difficulty },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-amber-300">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-300">ตรวจสอบผู้เล่น คะแนน และประวัติเกมตามระดับ Bot</p>
      </div>

      <DifficultyTabs current={difficulty} basePath="/admin" />

      <AdminPanel
        users={usersWithStats}
        totalGames={totalGames}
        totalPlayers={totalPlayers}
        recentGames={recentGames}
        difficulty={difficulty}
      />
    </section>
  );
}
