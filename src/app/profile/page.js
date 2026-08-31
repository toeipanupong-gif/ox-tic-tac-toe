import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "@/lib/game/difficulty";
import { getOrCreateAllStats } from "@/lib/game/stats";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Profile",
  description: "โปรไฟล์ผู้เล่น OX Arena — สถิติและประวัติเกมของคุณ",
  path: "/profile",
});

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) redirect("/login");

  const difficulty = DEFAULT_DIFFICULTY;
  const pageSize = DEFAULT_PAGE_SIZE;

  const [statsByDifficultyRaw, totalGames, games] = await Promise.all([
    getOrCreateAllStats(user.id),
    prisma.game.count({
      where: { userId: user.id, difficulty },
    }),
    prisma.game.findMany({
      where: { userId: user.id, difficulty },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      select: {
        id: true,
        result: true,
        scoreChange: true,
        bonusScore: true,
        winStreak: true,
        createdAt: true,
      },
    }),
  ]);

  const statsByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((level) => {
      const stat = statsByDifficultyRaw[level];
      return [
        level,
        {
          score: stat.score,
          wins: stat.wins,
          losses: stat.losses,
          draws: stat.draws,
          winStreak: stat.winStreak,
        },
      ];
    })
  );

  return (
    <ProfileView
      user={user}
      statsByDifficulty={statsByDifficulty}
      initialDifficulty={difficulty}
      initialGames={{
        games: games.map((g) => ({
          ...g,
          createdAt: g.createdAt.toISOString(),
        })),
        total: totalGames,
        page: 1,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalGames / pageSize)),
      }}
    />
  );
}
