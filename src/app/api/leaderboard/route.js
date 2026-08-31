import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";

function mapPlayer(stat) {
  return {
    id: stat.user.id,
    name: stat.user.name,
    email: stat.user.email,
    score: stat.score,
    wins: stat.wins,
    losses: stat.losses,
    draws: stat.draws,
  };
}

async function findSelfRank(userId, difficulty) {
  const selfStat = await prisma.userStat.findUnique({
    where: { userId_difficulty: { userId, difficulty } },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
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
    player: mapPlayer(selfStat),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const where = {
    difficulty,
    user: { role: "USER" },
  };

  const [total, stats, session] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { score: "desc" },
        { wins: "desc" },
        { losses: "asc" },
        { user: { name: "asc" } },
      ],
      skip,
      take: pageSize,
    }),
    auth(),
  ]);

  const players = stats.map(mapPlayer);
  const result = paginatedResult({ items: players, total, page, pageSize });

  let self = null;
  if (session?.user?.id) {
    self = await findSelfRank(session.user.id, difficulty);
  }

  return NextResponse.json({
    players: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    self,
    currentUserId: session?.user?.id ?? null,
  });
}
