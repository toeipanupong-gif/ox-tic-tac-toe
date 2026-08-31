import {
  BOT,
  PLAYER,
  checkWinner,
  getAvailableMoves,
  isDraw,
} from "./game-engine.js";
import { normalizeDifficulty } from "./difficulty.js";

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

function getMinimaxMove(board) {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const next = [...board];
    next[move] = BOT;
    const score = minimax(next, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function findImmediateWin(board, symbol) {
  for (const move of getAvailableMoves(board)) {
    const next = [...board];
    next[move] = symbol;
    if (checkWinner(next)?.winner === symbol) return move;
  }
  return null;
}

function getHardMove(board) {
  const winMove = findImmediateWin(board, BOT);
  if (winMove !== null) return winMove;

  const blockMove = findImmediateWin(board, PLAYER);
  if (blockMove !== null) return blockMove;

  return getMinimaxMove(board);
}

function getEasyMove(board) {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

/** @param {Array} board @param {"EASY"|"NORMAL"|"HARD"} [difficulty] */
export function getBotMove(board, difficulty = "NORMAL") {
  const level = normalizeDifficulty(difficulty);
  if (level === "EASY") return getEasyMove(board);
  if (level === "HARD") return getHardMove(board);
  return getMinimaxMove(board);
}
