export const EMPTY = null;
export const PLAYER = "X";
export const BOT = "O";

export function createBoard() {
  return Array(9).fill(EMPTY);
}

export function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === EMPTY) moves.push(i);
  }
  return moves;
}

export function makeMove(board, position, player) {
  if (position < 0 || position > 8) {
    throw new Error("Invalid position");
  }
  if (board[position] !== EMPTY) {
    throw new Error("Cell already occupied");
  }
  const next = [...board];
  next[position] = player;
  return next;
}

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

export function isDraw(board) {
  return !checkWinner(board) && getAvailableMoves(board).length === 0;
}

export function getGameStatus(board, playerSymbol = PLAYER, botSymbol = BOT) {
  const result = checkWinner(board);
  if (result?.winner === playerSymbol) return "WIN";
  if (result?.winner === botSymbol) return "LOSS";
  if (isDraw(board)) return "DRAW";
  return "PLAYING";
}

export function serializeBoard(board) {
  return JSON.stringify(board);
}

export function deserializeBoard(raw) {
  return JSON.parse(raw);
}
