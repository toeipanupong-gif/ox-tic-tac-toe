import {
  BOT,
  PLAYER,
  checkWinner,
  getAvailableMoves,
  isDraw,
} from "./game-engine.js";
import { normalizeDifficulty } from "./difficulty.js";

/** อัตราเลือกตาที่ดีที่สุด (หลัง win/block แล้ว) */
const OPTIMAL_RATE = {
  NORMAL: 0.50,
  HARD: 0.85,
};

function evaluate(board) {
  const result = checkWinner(board);
  if (result?.winner === BOT) return 10;
  if (result?.winner === PLAYER) return -10;
  if (isDraw(board)) return 0;
  return null;
}

function minimax(board, isMaximizing) {
  const score = evaluate(board);
  if (score !== null) return score;

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = [...board];
      next[move] = BOT;
      best = Math.max(best, minimax(next, false));
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = [...board];
    next[move] = PLAYER;
    best = Math.min(best, minimax(next, true));
  }
  return best;
}

function scoreMoves(board) {
  return getAvailableMoves(board).map((move) => {
    const next = [...board];
    next[move] = BOT;
    return { move, score: minimax(next, false) };
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function findImmediateWin(board, symbol) {
  for (const move of getAvailableMoves(board)) {
    const next = [...board];
    next[move] = symbol;
    if (checkWinner(next)?.winner === symbol) return move;
  }
  return null;
}

function getEasyMove(board) {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;
  return pickRandom(moves);
}

/**
 * ลำดับความสำคัญ:
 * 1) ชนะทันที
 * 2) บล็อกผู้เล่น
 * 3) ด้วยโอกาส optimalRate เลือกตาที่ดีที่สุด (minimax)
 * 4) นอกนั้นพลาดแบบควบคุมได้
 *    - Hard: พลาดเฉพาะตาที่ไม่แพ้ทันที (score >= 0) ถ้ามี
 *    - Normal: สุ่มช่องว่างที่เหลือ
 */
function getStrategicMove(board, { optimalRate, preferSafeMistake }) {
  const winMove = findImmediateWin(board, BOT);
  if (winMove !== null) return winMove;

  const blockMove = findImmediateWin(board, PLAYER);
  if (blockMove !== null) return blockMove;

  const scored = scoreMoves(board);
  if (scored.length === 0) return null;

  const bestScore = Math.max(...scored.map((s) => s.score));
  const bestMoves = scored.filter((s) => s.score === bestScore);

  if (Math.random() < optimalRate) {
    return pickRandom(bestMoves).move;
  }

  const suboptimal = scored.filter((s) => s.score < bestScore);
  if (suboptimal.length === 0) return pickRandom(bestMoves).move;

  if (preferSafeMistake) {
    const safe = suboptimal.filter((s) => s.score >= 0);
    const pool = safe.length > 0 ? safe : suboptimal;
    return pickRandom(pool).move;
  }

  return pickRandom(suboptimal).move;
}

/** @param {Array} board @param {"EASY"|"NORMAL"|"HARD"} [difficulty] */
export function getBotMove(board, difficulty = "NORMAL") {
  const level = normalizeDifficulty(difficulty);
  if (level === "EASY") return getEasyMove(board);

  if (level === "HARD") {
    return getStrategicMove(board, {
      optimalRate: OPTIMAL_RATE.HARD,
      preferSafeMistake: true,
    });
  }

  return getStrategicMove(board, {
    optimalRate: OPTIMAL_RATE.NORMAL,
    preferSafeMistake: false,
  });
}
