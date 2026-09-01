import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";
import { mapLeaderboardPlayer } from "@/lib/leaderboard";
import { findSelfRank } from "@/lib/leaderboard-server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const where = {
    difficulty,
    user: { role: "USER" },
  };

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const [total, stats, self] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, maskedName: true } },
      },
      // ไม่ orderBy user.name — ciphertext ไม่มีความหมาย + ใช้ index ไม่เต็ม
      orderBy: [{ score: "desc" }, { wins: "desc" }, { losses: "asc" }],
      skip,
      take: pageSize,
    }),
    currentUserId
      ? findSelfRank(currentUserId, difficulty)
      : Promise.resolve(null),
  ]);

  const players = stats.map((stat) =>
    mapLeaderboardPlayer(stat, { isSelf: stat.user.id === currentUserId })
  );
  const result = paginatedResult({ items: players, total, page, pageSize });

  return NextResponse.json({
    players: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    self,
    currentUserId,
  });
}
