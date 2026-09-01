"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Board from "./Board";
import ScoreBoard from "./ScoreBoard";
import ResultOverlay from "./ResultOverlay";
import RateLimitModal from "./RateLimitModal";
import { checkWinner } from "@/lib/game/game-engine";
import { difficultyLabel, normalizeDifficulty } from "@/lib/game/difficulty";

const EMPTY_BOARD = Array(9).fill(null);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function botThinkDelay() {
  return 650 + Math.floor(Math.random() * 450);
}

function readGameApiError(res, data, fallback) {
  if (res.status === 429 && data?.code === "RATE_LIMITED") {
    return {
      kind: "rateLimit",
      message: data.message,
      retryAfterSeconds: data.retryAfterSeconds ?? 0,
    };
  }
  return {
    kind: "error",
    message: data?.error || fallback,
  };
}

export default function GameClient({
  initialScore = 0,
  initialWinStreak = 0,
  difficulty = "NORMAL",
}) {
  const level = normalizeDifficulty(difficulty);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [status, setStatus] = useState("PLAYING");
  const [score, setScore] = useState(initialScore);
  const [winStreak, setWinStreak] = useState(initialWinStreak);
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [lastMoveIndex, setLastMoveIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [rateLimitNotice, setRateLimitNotice] = useState(null);
  const [isPending, startTransition] = useTransition();
  const boardBeforeMove = useRef(EMPTY_BOARD);

  const startGame = useCallback(() => {
    startTransition(async () => {
      setError("");
      setScoreResult(null);
      setShowResult(false);
      setBotThinking(false);
      setLastMoveIndex(null);
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: level }),
      });
      const data = await res.json();
      if (!res.ok) {
        const apiError = readGameApiError(res, data, "เริ่มเกมไม่สำเร็จ");
        if (apiError.kind === "rateLimit") {
          setRateLimitNotice(apiError);
          setError("");
        } else {
          setError(apiError.message);
        }
        return;
      }
      setBoard(data.board);
      boardBeforeMove.current = data.board;
      setStatus(data.status);
      setScore(data.score);
      setWinStreak(data.winStreak);
      setStarted(true);
    });
  }, [level]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  function handleCellClick(position) {
    if (status !== "PLAYING" || isPending || botThinking) return;
    if (board[position]) return;

    boardBeforeMove.current = board;
    const optimistic = board.map((cell, i) =>
      i === position ? "X" : cell
    );
    setBoard(optimistic);
    setLastMoveIndex(position);
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(boardBeforeMove.current);
        setLastMoveIndex(null);
        setBotThinking(false);
        const apiError = readGameApiError(res, data, "เดินหมากไม่สำเร็จ");
        if (apiError.kind === "rateLimit") {
          setRateLimitNotice(apiError);
          setError("");
        } else {
          setError(apiError.message);
        }
        return;
      }

      const hasBotMove =
        data.botPosition !== null && data.botPosition !== undefined;

      if (hasBotMove) {
        setBotThinking(true);
        await sleep(botThinkDelay());
        setBoard(data.board);
        setLastMoveIndex(data.botPosition);
        setBotThinking(false);
      } else {
        setBoard(data.board);
      }

      setStatus(data.status);
      if (typeof data.score === "number") {
        setScore(data.score);
        setWinStreak(data.winStreak ?? 0);
      }
      setScoreResult(data.scoreResult ?? null);
      boardBeforeMove.current = data.board;

      if (data.status !== "PLAYING") {
        await sleep(380);
        setShowResult(true);
      }
    });
  }

  const winningLine = checkWinner(board)?.line ?? [];
  const boardLocked = status !== "PLAYING" || isPending || botThinking;

  return (
    <div className="relative space-y-4 sm:space-y-6">
      <ScoreBoard
        score={score}
        winStreak={winStreak}
        status={status}
        turn="PLAYER"
        botThinking={botThinking}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 sm:gap-4 sm:text-sm">
        <span>
          คุณ: <strong className="text-cyan-300">X</strong>
        </span>
        <span>
          Bot: <strong className="text-amber-300">O</strong>
        </span>
        <span className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 font-semibold text-teal-200 sm:px-3">
          {difficultyLabel(level)}
        </span>
      </div>

      <div className="relative">
        {started ? (
          <Board
            board={board}
            onCellClick={handleCellClick}
            disabled={boardLocked}
            winningLine={winningLine}
            lastMoveIndex={lastMoveIndex}
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-slate-400">
            กำลังเริ่มเกม...
          </div>
        )}

        {botThinking && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="bot-thinking-badge flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-slate-950/85 px-4 py-2 text-sm font-semibold text-amber-200 shadow-lg backdrop-blur-sm">
              <span className="bot-thinking-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              Bot กำลังคิด...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-center text-sm text-rose-300">{error}</p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={startGame}
          disabled={isPending || botThinking}
          className="cursor-pointer rounded-xl bg-teal-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-60"
        >
          เกมใหม่
        </button>
        {status !== "PLAYING" && (
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-xl border border-slate-600/80 bg-slate-900/80 px-6 py-3 font-semibold text-slate-100 transition hover:border-teal-500/50 hover:text-teal-200"
          >
            กลับหน้าแรก
          </Link>
        )}
      </div>

      {showResult && (
        <ResultOverlay
          status={status}
          scoreResult={scoreResult}
          onClose={() => setShowResult(false)}
        />
      )}

      {rateLimitNotice && (
        <RateLimitModal
          message={rateLimitNotice.message}
          retryAfterSeconds={rateLimitNotice.retryAfterSeconds}
          onClose={() => setRateLimitNotice(null)}
        />
      )}
    </div>
  );
}
