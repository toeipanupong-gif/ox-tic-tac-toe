import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BOT,
  PLAYER,
  createBoard,
  serializeBoard,
} from "@/lib/game/game-engine";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { getUserStat, UserNotFoundError } from "@/lib/game/stats";
import { enforceGameRateLimit } from "@/lib/game-api";

const bodySchema = z.object({
  difficulty: z.enum(["EASY", "NORMAL", "HARD"]).optional(),
});

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // session callback ยืนยัน user ใน DB แล้ว — ไม่ต้อง findUnique ซ้ำ
  const userId = session.user.id;

  let difficulty = "NORMAL";
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.parse(json || {});
    difficulty = normalizeDifficulty(parsed.difficulty);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rateLimited = await enforceGameRateLimit(userId, "game:start");
  if (rateLimited) return rateLimited;

  const board = createBoard();

  try {
    const [activeGame, stat] = await Promise.all([
      prisma.activeGame.upsert({
        where: { userId },
        create: {
          userId,
          board: serializeBoard(board),
          status: "PLAYING",
          difficulty,
          playerSymbol: PLAYER,
          botSymbol: BOT,
        },
        update: {
          board: serializeBoard(board),
          status: "PLAYING",
          difficulty,
          playerSymbol: PLAYER,
          botSymbol: BOT,
        },
      }),
      getUserStat(userId, difficulty),
    ]);

    return NextResponse.json({
      gameId: activeGame.id,
      board,
      status: activeGame.status,
      difficulty,
      playerSymbol: activeGame.playerSymbol,
      botSymbol: activeGame.botSymbol,
      turn: "PLAYER",
      score: stat.score,
      winStreak: stat.winStreak,
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
