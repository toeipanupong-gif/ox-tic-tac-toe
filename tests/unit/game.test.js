import { describe, expect, it } from "vitest";
import {
  checkWinner,
  createBoard,
  getAvailableMoves,
  isDraw,
  makeMove,
} from "../../src/lib/game/game-engine.js";
import { getBotMove } from "../../src/lib/game/minimax.js";
import { calculateScore } from "../../src/lib/game/score.js";

describe("game-engine", () => {
  it("creates empty board", () => {
    expect(createBoard()).toEqual(Array(9).fill(null));
  });

  it("makes a move", () => {
    const board = makeMove(createBoard(), 4, "X");
    expect(board[4]).toBe("X");
  });

  it("detects winner", () => {
    const board = ["X", "X", "X", null, null, null, null, null, null];
    expect(checkWinner(board)?.winner).toBe("X");
  });

  it("detects draw", () => {
    const board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(isDraw(board)).toBe(true);
  });

  it("lists available moves", () => {
    const board = makeMove(createBoard(), 0, "X");
    expect(getAvailableMoves(board)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("minimax", () => {
  it("normal blocks player win", () => {
    const board = ["X", "X", null, null, "O", null, null, null, null];
    expect(getBotMove(board, "NORMAL")).toBe(2);
  });

  it("normal takes winning move", () => {
    const board = ["O", "O", null, "X", "X", null, null, null, null];
    expect(getBotMove(board, "NORMAL")).toBe(2);
  });

  it("hard takes win even when player also threatens", () => {
    // Bot ชนะที่ 6, ผู้เล่นขู่ที่ 7 — Hard ต้องเลือก 6
    const board = ["O", "X", null, "O", "X", null, null, null, null];
    expect(getBotMove(board, "HARD")).toBe(6);
  });

  it("hard blocks when no immediate win", () => {
    const board = ["X", "X", null, null, "O", null, null, null, null];
    expect(getBotMove(board, "HARD")).toBe(2);
  });

  it("easy returns an available move", () => {
    const board = ["X", null, null, null, "O", null, null, null, null];
    const move = getBotMove(board, "EASY");
    expect([1, 2, 3, 5, 6, 7, 8]).toContain(move);
  });
});

describe("score", () => {
  it("applies win streak bonus on 3rd win", () => {
    let streak = 0;
    let score = 0;

    for (let i = 0; i < 3; i += 1) {
      const result = calculateScore("WIN", streak);
      score += result.nextScoreDelta;
      streak = result.nextStreak;
    }

    expect(score).toBe(4);
    expect(streak).toBe(0);
  });

  it("resets streak on loss", () => {
    const first = calculateScore("WIN", 0);
    const second = calculateScore("WIN", first.nextStreak);
    const loss = calculateScore("LOSS", second.nextStreak);

    expect(second.nextStreak).toBe(2);
    expect(loss.nextStreak).toBe(0);
    expect(loss.bonusScore).toBe(0);
    expect(loss.nextScoreDelta).toBe(-1);
  });

  it("resets streak on draw without score change", () => {
    const result = calculateScore("DRAW", 2);
    expect(result.nextScoreDelta).toBe(0);
    expect(result.nextStreak).toBe(0);
  });
});
