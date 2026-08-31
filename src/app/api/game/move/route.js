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

const bodySchema = z.object({
  position: z.number().int().min(0).max(8),
});

async function finishGame(tx, userId, result, currentStreak) {
  const calc = calculateScore(result, currentStreak);

  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const updated = await tx.user.update({
    where: { id: userId },
    data: {
      score: user.score + calc.nextScoreDelta,
      winStreak: calc.nextStreak,
      wins: result === "WIN" ? user.wins + 1 : user.wins,
      losses: result === "LOSS" ? user.losses + 1 : user.losses,
      draws: result === "DRAW" ? user.draws + 1 : user.draws,
    },
  });

  await tx.game.create({
    data: {
      userId,
      result,
      scoreChange: calc.scoreChange,
      bonusScore: calc.bonusScore,
      winStreak: calc.nextStreak,
    },
  });

  return { user: updated, calc };
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

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
    botPosition = getBotMove(board);
    if (botPosition !== null) {
      board = makeMove(board, botPosition, BOT);
      status = getGameStatus(board);
    }
  }

  if (status !== "PLAYING") {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const finished = await finishGame(tx, userId, status, user.winStreak);

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
    userStats = {
      score: result.user.score,
      winStreak: result.user.winStreak,
      wins: result.user.wins,
      losses: result.user.losses,
      draws: result.user.draws,
    };
  } else {
    await prisma.activeGame.update({
      where: { userId },
      data: {
        board: serializeBoard(board),
        status: "PLAYING",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        score: true,
        winStreak: true,
        wins: true,
        losses: true,
        draws: true,
      },
    });
    userStats = user;
  }

  return NextResponse.json({
    board,
    status,
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
