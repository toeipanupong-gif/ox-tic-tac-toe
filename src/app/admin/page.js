import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/admin/AdminPanel";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Admin",
  description: "แผงควบคุมแอดมิน OX Arena",
  path: "/admin",
  noIndex: true,
});

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const difficulty = DEFAULT_DIFFICULTY;
  const pageSize = DEFAULT_PAGE_SIZE;

  const [totalPlayers, totalGames, playerTotal, playerRows, gameRows] =
    await Promise.all([
      prisma.user.count(),
      prisma.game.count({ where: { difficulty } }),
      prisma.userStat.count({ where: { difficulty } }),
      prisma.userStat.findMany({
        where: { difficulty },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: [{ score: "desc" }, { wins: "desc" }],
        take: pageSize,
      }),
      prisma.game.findMany({
        where: { difficulty },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

  const players = playerRows.map((s) => ({
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    role: s.user.role,
    score: s.score,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    winStreak: s.winStreak,
  }));

  const games = gameRows.map((g) => ({
    id: g.id,
    result: g.result,
    scoreChange: g.scoreChange,
    bonusScore: g.bonusScore,
    winStreak: g.winStreak,
    createdAt: g.createdAt.toISOString(),
    user: g.user,
  }));

  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-amber-300 sm:text-4xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          ตรวจสอบผู้เล่น คะแนน และประวัติเกมตามระดับ Bot
        </p>
      </div>

      <AdminPanel
        initialDifficulty={difficulty}
        initialSummary={{ totalPlayers, totalGames }}
        initialPlayers={{
          players,
          total: playerTotal,
          page: 1,
          pageSize,
          totalPages: Math.max(1, Math.ceil(playerTotal / pageSize)),
        }}
        initialGames={{
          games,
          total: totalGames,
          page: 1,
          pageSize,
          totalPages: Math.max(1, Math.ceil(totalGames / pageSize)),
        }}
      />
    </section>
  );
}
