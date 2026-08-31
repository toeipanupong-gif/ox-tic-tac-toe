import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";
import { DIFFICULTIES } from "@/lib/game/difficulty";
import { getOrCreateAllStats } from "@/lib/game/stats";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) redirect("/login");

  const [statsByDifficultyRaw, games] = await Promise.all([
    getOrCreateAllStats(user.id),
    prisma.game.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        difficulty: true,
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

  const gamesByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((level) => [
      level,
      games
        .filter((g) => g.difficulty === level)
        .map((g) => ({
          id: g.id,
          result: g.result,
          scoreChange: g.scoreChange,
          bonusScore: g.bonusScore,
          winStreak: g.winStreak,
          createdAt: g.createdAt.toISOString(),
        })),
    ])
  );

  return (
    <ProfileView
      user={user}
      statsByDifficulty={statsByDifficulty}
      gamesByDifficulty={gamesByDifficulty}
    />
  );
}
