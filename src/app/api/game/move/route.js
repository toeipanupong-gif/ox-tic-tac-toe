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
import { enforceGameRateLimit } from "@/lib/game-api";

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

  const rateLimited = await enforceGameRateLimit(userId, "game:move");
  if (rateLimited) return rateLimited;

  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const outcome = await prisma.$transaction(async (tx) => {
    const activeGame = await tx.activeGame.findUnique({ where: { userId } });
    if (!activeGame || activeGame.status !== "PLAYING") {
      return { error: "No active game", status: 400 };
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
      return {
        error: error.message || "Invalid move",
        status: 400,
      };
    }

    let status = getGameStatus(board);
    let botPosition = null;

    if (status === "PLAYING") {
      botPosition = getBotMove(board, difficulty);
      if (botPosition !== null) {
        board = makeMove(board, botPosition, BOT);
        status = getGameStatus(board);
      }
    }

    if (status !== "PLAYING") {
      const claimed = await tx.activeGame.updateMany({
        where: { userId, status: "PLAYING" },
        data: {
          board: serializeBoard(board),
          status,
        },
      });
      if (claimed.count === 0) {
        return { error: "Game already finished", status: 409 };
      }

      const current = await getUserStat(userId, difficulty, tx);
      const finished = await finishGame(
        tx,
        userId,
        difficulty,
        status,
        current.winStreak
      );

      return {
        board,
        status,
        difficulty,
        botPosition,
        finished,
      };
    }

    await tx.activeGame.update({
      where: { userId },
      data: {
        board: serializeBoard(board),
        status: "PLAYING",
      },
    });

    const userStats = await getUserStat(userId, difficulty, tx);
    return {
      board,
      status,
      difficulty,
      botPosition,
      userStats,
    };
  });

  if (outcome.error) {
    return NextResponse.json(
      { error: outcome.error },
      { status: outcome.status }
    );
  }

  let scorePayload = null;
  let userStats = outcome.userStats;

  if (outcome.finished) {
    scorePayload = {
      scoreChange: outcome.finished.calc.scoreChange,
      bonusScore: outcome.finished.calc.bonusScore,
      nextScoreDelta: outcome.finished.calc.nextScoreDelta,
    };
    userStats = outcome.finished.stat;
  }

  return NextResponse.json({
    board: outcome.board,
    status: outcome.status,
    difficulty: outcome.difficulty,
    playerSymbol: PLAYER,
    botSymbol: BOT,
    turn: outcome.status === "PLAYING" ? "PLAYER" : null,
    botPosition: outcome.botPosition,
    score: userStats?.score ?? 0,
    winStreak: userStats?.winStreak ?? 0,
    wins: userStats?.wins ?? 0,
    losses: userStats?.losses ?? 0,
    draws: userStats?.draws ?? 0,
    scoreResult: scorePayload,
  });
}
