import { prisma } from "@/lib/prisma";
import { mapLeaderboardPlayer } from "@/lib/leaderboard";

export async function findSelfRank(userId, difficulty) {
  const selfStat = await prisma.userStat.findUnique({
    where: { userId_difficulty: { userId, difficulty } },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  if (!selfStat || selfStat.user.role !== "USER") return null;

  const betterCount = await prisma.userStat.count({
    where: {
      difficulty,
      user: { role: "USER" },
      OR: [
        { score: { gt: selfStat.score } },
        {
          AND: [{ score: selfStat.score }, { wins: { gt: selfStat.wins } }],
        },
        {
          AND: [
            { score: selfStat.score },
            { wins: selfStat.wins },
            { losses: { lt: selfStat.losses } },
          ],
        },
      ],
    },
  });

  return {
    rank: betterCount + 1,
    player: mapLeaderboardPlayer(selfStat, { isSelf: true }),
  };
}
