"use client";

import { useEffect, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";

const PAGE_SIZE = 10;

function formatWinRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

const RESULT_STYLE = {
  WIN: "text-teal-300",
  LOSS: "text-rose-300",
  DRAW: "text-slate-200",
};

const STAT_CARDS = [
  { key: "score", label: "Score", color: "border-cyan-500/40 bg-cyan-500/10", valueClass: "text-cyan-300" },
  { key: "wins", label: "Wins", color: "border-teal-500/40 bg-teal-500/10", valueClass: "text-teal-300" },
  { key: "losses", label: "Losses", color: "border-rose-500/40 bg-rose-500/10", valueClass: "text-rose-300" },
  { key: "draws", label: "Draws", color: "border-slate-500/40 bg-slate-500/10", valueClass: "text-slate-200" },
  { key: "winRate", label: "Win Rate", color: "border-amber-500/40 bg-amber-500/10", valueClass: "text-amber-300" },
  { key: "winStreak", label: "Win Streak", color: "border-violet-500/40 bg-violet-500/10", valueClass: "text-violet-300" },
];

export default function ProfileView({
  user,
  statsByDifficulty,
  gamesByDifficulty,
}) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();
  const [page, setPage] = useState(1);

  const stat =
    statsByDifficulty[difficulty] ||
    statsByDifficulty[DEFAULT_DIFFICULTY] || {
      score: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
    };

  const games =
    gamesByDifficulty[difficulty] ||
    gamesByDifficulty[DEFAULT_DIFFICULTY] ||
    [];

  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageGames = games.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [difficulty]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
    setPage(1);
  }

  const values = {
    score: stat.score,
    wins: stat.wins,
    losses: stat.losses,
    draws: stat.draws,
    winRate: formatWinRate(stat.wins, stat.losses, stat.draws),
    winStreak: stat.winStreak,
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-teal-300">
            {user.name || "Player"}
          </h1>
          <p className="mt-1 text-slate-400">{user.email}</p>
        </div>

        <DifficultyDropdown value={difficulty} onChange={onSelectDifficulty} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-2xl border p-4 ${card.color}`}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {card.label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${card.valueClass}`}>
              {values[card.key]}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Game History</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Score Δ</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {pageGames.map((game) => {
                const color = RESULT_STYLE[game.result] || "text-slate-200";
                return (
                  <tr key={game.id} className="border-t border-slate-800/80">
                    <td className={`px-4 py-3 font-semibold ${color}`}>
                      {game.result}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>
                      {game.scoreChange}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>
                      {game.bonusScore}
                    </td>
                    <td className="px-4 py-3">{game.winStreak}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(game.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                );
              })}
              {pageGames.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    ยังไม่มีประวัติเกม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
                safePage <= 1
                  ? "pointer-events-none opacity-40"
                  : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
              }`}
            >
              ก่อนหน้า
            </button>
            <span className="text-sm text-slate-400">
              หน้า {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
                safePage >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
              }`}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
