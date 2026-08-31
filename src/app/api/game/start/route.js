import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BOT,
  PLAYER,
  createBoard,
  serializeBoard,
} from "@/lib/game/game-engine";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const board = createBoard();

  const activeGame = await prisma.activeGame.upsert({
    where: { userId },
    create: {
      userId,
      board: serializeBoard(board),
      status: "PLAYING",
      playerSymbol: PLAYER,
      botSymbol: BOT,
    },
    update: {
      board: serializeBoard(board),
      status: "PLAYING",
      playerSymbol: PLAYER,
      botSymbol: BOT,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { score: true, winStreak: true },
  });

  return NextResponse.json({
    gameId: activeGame.id,
    board,
    status: activeGame.status,
    playerSymbol: activeGame.playerSymbol,
    botSymbol: activeGame.botSymbol,
    turn: "PLAYER",
    score: user?.score ?? 0,
    winStreak: user?.winStreak ?? 0,
  });
}
