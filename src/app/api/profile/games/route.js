import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const where = {
    userId: session.user.id,
    difficulty,
  };

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
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

  const items = games.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
  }));

  const result = paginatedResult({ items, total, page, pageSize });

  return NextResponse.json({
    games: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
