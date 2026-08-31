import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DIFFICULTIES, normalizeDifficulty } from "@/lib/game/difficulty";

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficultyParam = searchParams.get("difficulty");

  const totalPlayers = await prisma.user.count();

  if (difficultyParam) {
    const difficulty = normalizeDifficulty(difficultyParam);
    const totalGames = await prisma.game.count({ where: { difficulty } });
    return NextResponse.json({ totalPlayers, totalGames, difficulty });
  }

  const counts = await Promise.all(
    DIFFICULTIES.map((difficulty) =>
      prisma.game.count({ where: { difficulty } }).then((totalGames) => [
        difficulty,
        totalGames,
      ])
    )
  );

  return NextResponse.json({
    totalPlayers,
    totalGamesByDifficulty: Object.fromEntries(counts),
  });
}
