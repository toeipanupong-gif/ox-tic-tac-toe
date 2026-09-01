import { prisma } from "@/lib/prisma";
import { mapLeaderboardPlayer } from "@/lib/leaderboard";

/**
 * อันดับของผู้เล่น — นับคนที่ดีกว่าด้วย tie-break เดียวกับ orderBy leaderboard
 * ใช้ index (difficulty, score, wins, losses)
 */
export async function findSelfRank(userId, difficulty) {
  const selfStat = await prisma.userStat.findUnique({
    where: { userId_difficulty: { userId, difficulty } },
    include: {
      user: { select: { id: true, name: true, maskedName: true, role: true } },
    },
  });

  if (!selfStat || selfStat.user.role !== "USER") return null;

  const { score, wins, losses } = selfStat;

  const betterCount = await prisma.userStat.count({
    where: {
      difficulty,
      user: { role: "USER" },
      OR: [
        { score: { gt: score } },
        { score, wins: { gt: wins } },
        { score, wins, losses: { lt: losses } },
      ],
    },
  });

  return {
    rank: betterCount + 1,
    player: mapLeaderboardPlayer(selfStat, { isSelf: true }),
  };
}
