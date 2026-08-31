"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Board from "./Board";
import ScoreBoard from "./ScoreBoard";
import { checkWinner } from "@/lib/game/game-engine";
import { difficultyLabel, normalizeDifficulty } from "@/lib/game/difficulty";

const EMPTY_BOARD = Array(9).fill(null);

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
  const [isPending, startTransition] = useTransition();

  const startGame = useCallback(() => {
    startTransition(async () => {
      setError("");
      setScoreResult(null);
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: level }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เริ่มเกมไม่สำเร็จ");
        return;
      }
      setBoard(data.board);
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
    if (status !== "PLAYING" || isPending) return;

    startTransition(async () => {
      setError("");
      const res = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เดินหมากไม่สำเร็จ");
        return;
      }
      setBoard(data.board);
      setStatus(data.status);
      setScore(data.score);
      setWinStreak(data.winStreak);
      setScoreResult(data.scoreResult);
    });
  }

  const winningLine = checkWinner(board)?.line ?? [];

  return (
    <div className="space-y-6">
      <ScoreBoard score={score} winStreak={winStreak} status={status} turn="PLAYER" />

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
        <span>
          คุณ: <strong className="text-cyan-300">X</strong>
        </span>
        <span>
          Bot: <strong className="text-amber-300">O</strong>
        </span>
        <span className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1 font-semibold text-teal-200">
          {difficultyLabel(level)}
        </span>
      </div>

      {started ? (
        <Board
          board={board}
          onCellClick={handleCellClick}
          disabled={status !== "PLAYING" || isPending}
          winningLine={winningLine}
        />
      ) : (
        <div className="flex h-64 items-center justify-center text-slate-400">กำลังเริ่มเกม...</div>
      )}

      {scoreResult && (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-center text-teal-100">
          คะแนน {scoreResult.nextScoreDelta >= 0 ? "+" : ""}
          {scoreResult.nextScoreDelta}
          {scoreResult.bonusScore > 0 ? ` (รวม Bonus +${scoreResult.bonusScore})` : ""}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-rose-300">{error}</p>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={startGame}
          disabled={isPending}
          className="rounded-xl bg-teal-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-60"
        >
          เกมใหม่
        </button>
      </div>
    </div>
  );
}
