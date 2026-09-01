import { auth, loadUserDisplayPii } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/ProfileView";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "@/lib/game/difficulty";
import { getOrCreateAllStats, UserNotFoundError } from "@/lib/game/stats";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Profile",
  description: "โปรไฟล์ผู้เล่น OX Arena — สถิติและประวัติเกมของคุณ",
  path: "/profile",
});

function clearSessionAndLogin() {
  redirect("/api/auth/invalidate");
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    clearSessionAndLogin();
  }

  const difficulty = DEFAULT_DIFFICULTY;
  const pageSize = DEFAULT_PAGE_SIZE;

  let statsByDifficultyRaw;
  let totalGames;
  let games;
  let display;
  try {
    [statsByDifficultyRaw, totalGames, games, display] = await Promise.all([
      getOrCreateAllStats(session.user.id, undefined, { skipAssert: true }),
      prisma.game.count({
        where: { userId: session.user.id, difficulty },
      }),
      prisma.game.findMany({
        where: { userId: session.user.id, difficulty },
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
      loadUserDisplayPii(session.user.id),
    ]);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      clearSessionAndLogin();
    }
    throw error;
  }

  const user = {
    id: session.user.id,
    name: display.name,
    email: display.email,
  };

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
