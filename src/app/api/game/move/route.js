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
import { enforceGameRateLimit } from "@/lib/game-api";

const bodySchema = z.object({
  position: z.number().int().min(0).max(8),
});

/** คำนวณนอก txn — คืน calc + nextData จาก current snap */
function planFinish(result, current) {
  const calc = calculateScore(result, current?.winStreak ?? 0);
  return {
    calc,
    nextData: {
      score: (current?.score ?? 0) + calc.nextScoreDelta,
      winStreak: calc.nextStreak,
      wins: (current?.wins ?? 0) + (result === "WIN" ? 1 : 0),
      losses: (current?.losses ?? 0) + (result === "LOSS" ? 1 : 0),
      draws: (current?.draws ?? 0) + (result === "DRAW" ? 1 : 0),
    },
  };
}

/**
 * เขียน stat + game ใน txn หลัง claim แล้ว
 * ใช้ค่าที่คำนวณนอก txn เป็นหลัก — ถ้า snap เปลี่ยนค่อยอ่านใหม่ใน txn (rare)
 */
async function writeFinish(tx, userId, difficulty, result, snap) {
  const level = normalizeDifficulty(difficulty);
  let calc = snap.calc;
  let nextData = snap.nextData;
  let current = snap.current;

  let stat;
  if (current) {
    const updated = await tx.userStat.updateMany({
      where: {
        id: current.id,
        score: current.score,
        winStreak: current.winStreak,
        wins: current.wins,
        losses: current.losses,
        draws: current.draws,
      },
      data: nextData,
    });
    if (updated.count === 0) {
      const fresh = await tx.userStat.findUnique({ where: { id: current.id } });
      ({ calc, nextData } = planFinish(result, fresh));
      stat = await tx.userStat.update({
        where: { id: current.id },
        data: nextData,
      });
    } else {
      stat = { ...current, ...nextData };
    }
  } else {
    try {
      stat = await tx.userStat.create({
        data: { userId, difficulty: level, ...nextData },
      });
    } catch {
      const fresh = await tx.userStat.findUnique({
        where: { userId_difficulty: { userId, difficulty: level } },
      });
      ({ calc, nextData } = planFinish(result, fresh));
      stat = await tx.userStat.update({
        where: { id: fresh.id },
        data: nextData,
      });
    }
  }

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

  // session callback ยืนยัน user ใน DB แล้ว — ไม่ต้อง findUnique ซ้ำ
  const userId = session.user.id;

  const rateLimited = await enforceGameRateLimit(userId, "game:move");
  if (rateLimited) return rateLimited;

  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // อ่าน + คำนวณนอก txn — ลดเวลาถือ SQLite write lock (โดยเฉพาะ getBotMove)
  const activeGame = await prisma.activeGame.findUnique({ where: { userId } });
  if (!activeGame || activeGame.status !== "PLAYING") {
    return NextResponse.json({ error: "No active game" }, { status: 400 });
  }

  const difficulty = normalizeDifficulty(activeGame.difficulty);
  const previousBoard = activeGame.board;

  let board;
  try {
    board = makeMove(
      deserializeBoard(previousBoard),
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

  if (status === "PLAYING") {
    botPosition = getBotMove(board, difficulty);
    if (botPosition !== null) {
      board = makeMove(board, botPosition, BOT);
      status = getGameStatus(board);
    }
  }

  const nextBoard = serializeBoard(board);

  // จบเกม: อ่าน streak + คำนวณคะแนนนอก txn
  let finishSnap = null;
  if (status !== "PLAYING") {
    const current = await prisma.userStat.findUnique({
      where: { userId_difficulty: { userId, difficulty } },
    });
    const planned = planFinish(status, current);
    finishSnap = { current, ...planned };
  }

  // txn สั้น ๆ — claim ด้วย status + board เดิมกัน race แล้วเขียนอย่างเดียว
  const outcome = await prisma.$transaction(async (tx) => {
    if (status !== "PLAYING") {
      const claimed = await tx.activeGame.updateMany({
        where: {
          userId,
          status: "PLAYING",
          board: previousBoard,
        },
        data: {
          board: nextBoard,
          status,
        },
      });
      if (claimed.count === 0) {
        return { error: "Game already finished", status: 409 };
      }

      const finished = await writeFinish(
        tx,
        userId,
        difficulty,
        status,
        finishSnap
      );
      return { finished };
    }

    const updated = await tx.activeGame.updateMany({
      where: {
        userId,
        status: "PLAYING",
        board: previousBoard,
      },
      data: {
        board: nextBoard,
        status: "PLAYING",
      },
    });
    if (updated.count === 0) {
      return { error: "Game already finished", status: 409 };
    }

    return {};
  });

  if (outcome.error) {
    return NextResponse.json(
      { error: outcome.error },
      { status: outcome.status }
    );
  }

  // mid-game: ไม่ส่ง/ไม่อ่าน stat — client คง score จาก start อยู่แล้ว
  if (!outcome.finished) {
    return NextResponse.json({
      board,
      status,
      difficulty,
      playerSymbol: PLAYER,
      botSymbol: BOT,
      turn: "PLAYER",
      botPosition,
    });
  }

  const userStats = outcome.finished.stat;
  const scorePayload = {
    scoreChange: outcome.finished.calc.scoreChange,
    bonusScore: outcome.finished.calc.bonusScore,
    nextScoreDelta: outcome.finished.calc.nextScoreDelta,
  };

  return NextResponse.json({
    board,
    status,
    difficulty,
    playerSymbol: PLAYER,
    botSymbol: BOT,
    turn: null,
    botPosition,
    score: userStats?.score ?? 0,
    winStreak: userStats?.winStreak ?? 0,
    wins: userStats?.wins ?? 0,
    losses: userStats?.losses ?? 0,
    draws: userStats?.draws ?? 0,
    scoreResult: scorePayload,
  });
}
