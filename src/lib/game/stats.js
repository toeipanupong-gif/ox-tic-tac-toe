import { prisma } from "@/lib/prisma";
import { DIFFICULTIES, normalizeDifficulty } from "@/lib/game/difficulty";

const EMPTY_STAT = {
  score: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winStreak: 0,
};

export async function ensureUserStat(userId, difficulty, tx = prisma) {
  const level = normalizeDifficulty(difficulty);
  return tx.userStat.upsert({
    where: {
      userId_difficulty: { userId, difficulty: level },
    },
    create: { userId, difficulty: level, ...EMPTY_STAT },
    update: {},
  });
}

export async function getUserStat(userId, difficulty, tx = prisma) {
  const level = normalizeDifficulty(difficulty);
  const existing = await tx.userStat.findUnique({
    where: { userId_difficulty: { userId, difficulty: level } },
  });
  if (existing) return existing;
  return ensureUserStat(userId, level, tx);
}

export async function getOrCreateAllStats(userId, tx = prisma) {
  const stats = await Promise.all(
    DIFFICULTIES.map((difficulty) => ensureUserStat(userId, difficulty, tx))
  );
  return Object.fromEntries(stats.map((s) => [s.difficulty, s]));
}

export function emptyStatView(difficulty = "NORMAL") {
  return {
    difficulty: normalizeDifficulty(difficulty),
    ...EMPTY_STAT,
  };
}

export function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return wins / total;
}

export function formatWinRate(wins, losses, draws) {
  return `${(winRate(wins, losses, draws) * 100).toFixed(1)}%`;
}

export function sortPlayersByRank(players) {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const rateDiff =
      winRate(b.wins, b.losses, b.draws) - winRate(a.wins, a.losses, a.draws);
    if (rateDiff !== 0) return rateDiff;
    return (a.name || "").localeCompare(b.name || "");
  });
}
