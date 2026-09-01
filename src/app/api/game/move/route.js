import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BOT,
  PLAYER,
  deserializeBoard,
  getGameStatus,
  makeMove,
  serializeBoard,
} from "@/lib/game/game-engine";
import { getBotMove } from "@/lib/game/minimax";
import { calculateScore } from "@/lib/game/score";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { getUserStat } from "@/lib/game/stats";

const bodySchema = z.object({
  position: z.number().int().min(0).max(8),
});

async function finishGame(tx, userId, difficulty, result, currentStreak) {
  const calc = calculateScore(result, currentStreak);
  const level = normalizeDifficulty(difficulty);

  const current = await tx.userStat.upsert({
    where: { userId_difficulty: { userId, difficulty: level } },
    create: { userId, difficulty: level },
    update: {},
  });

  const stat = await tx.userStat.update({
    where: { id: current.id },
    data: {
      score: current.score + calc.nextScoreDelta,
      winStreak: calc.nextStreak,
      wins: result === "WIN" ? current.wins + 1 : current.wins,
      losses: result === "LOSS" ? current.losses + 1 : current.losses,
      draws: result === "DRAW" ? current.draws + 1 : current.draws,
    },
  });

  await tx.game.create({
    data: {
      userId,
      difficulty: level,
      result,
      scoreChange: calc.scoreChange,
      bonusScore: calc.bonusScore,
      winStreak: calc.nextStreak,
    },
  });

  return { stat, calc };
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = dbUser.id;

  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const activeGame = await prisma.activeGame.findUnique({ where: { userId } });
  if (!activeGame || activeGame.status !== "PLAYING") {
    return NextResponse.json({ error: "No active game" }, { status: 400 });
  }

  const difficulty = normalizeDifficulty(activeGame.difficulty);

  let board;
  try {
    board = makeMove(
      deserializeBoard(activeGame.board),
      body.position,
      PLAYER
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Invalid move" },
      { status: 400 }
    );
  }

  let status = getGameStatus(board);
  let botPosition = null;
  let scorePayload = null;
  let userStats = null;

  if (status === "PLAYING") {
    botPosition = getBotMove(board, difficulty);
    if (botPosition !== null) {
      board = makeMove(board, botPosition, BOT);
      status = getGameStatus(board);
    }
  }

  if (status !== "PLAYING") {
    const result = await prisma.$transaction(async (tx) => {
      const current = await getUserStat(userId, difficulty, tx);
      const finished = await finishGame(
        tx,
        userId,
        difficulty,
        status,
        current.winStreak
      );

      await tx.activeGame.update({
        where: { userId },
        data: {
          board: serializeBoard(board),
          status,
        },
      });

      return finished;
    });

    scorePayload = {
      scoreChange: result.calc.scoreChange,
      bonusScore: result.calc.bonusScore,
      nextScoreDelta: result.calc.nextScoreDelta,
    };
    userStats = result.stat;
  } else {
    await prisma.activeGame.update({
      where: { userId },
      data: {
        board: serializeBoard(board),
        status: "PLAYING",
      },
    });

    userStats = await getUserStat(userId, difficulty);
  }

  return NextResponse.json({
    board,
    status,
    difficulty,
    playerSymbol: PLAYER,
    botSymbol: BOT,
    turn: status === "PLAYING" ? "PLAYER" : null,
    botPosition,
    score: userStats?.score ?? 0,
    winStreak: userStats?.winStreak ?? 0,
    wins: userStats?.wins ?? 0,
    losses: userStats?.losses ?? 0,
    draws: userStats?.draws ?? 0,
    scoreResult: scorePayload,
  });
}
