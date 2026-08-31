"use client";

import { useEffect, useRef, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { totalBonus } from "@/lib/game/score";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

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
  { key: "bonus", label: "Bonus", color: "border-violet-500/40 bg-violet-500/10", valueClass: "text-violet-300" },
  { key: "wins", label: "Wins", color: "border-teal-500/40 bg-teal-500/10", valueClass: "text-teal-300" },
  { key: "losses", label: "Losses", color: "border-rose-500/40 bg-rose-500/10", valueClass: "text-rose-300" },
  { key: "draws", label: "Draws", color: "border-slate-500/40 bg-slate-500/10", valueClass: "text-slate-200" },
  { key: "winRate", label: "Win Rate", color: "border-amber-500/40 bg-amber-500/10", valueClass: "text-amber-300" },
  { key: "winStreak", label: "Win Streak", color: "border-fuchsia-500/40 bg-fuchsia-500/10", valueClass: "text-fuchsia-300" },
];

async function fetchGames(difficulty, page) {
  const params = new URLSearchParams({
    difficulty,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const res = await fetch(`/api/profile/games?${params}`);
  if (!res.ok) throw new Error("Failed to load games");
  return res.json();
}

export default function ProfileView({
  user,
  statsByDifficulty,
  initialDifficulty = DEFAULT_DIFFICULTY,
  initialGames,
}) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();
  const [page, setPage] = useState(1);
  const [gamesData, setGamesData] = useState(initialGames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const skipFirst = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    if (skipFirst.current && difficulty === initialDifficulty && page === 1) {
      skipFirst.current = false;
      return;
    }
    skipFirst.current = false;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    fetchGames(difficulty, page)
      .then((json) => {
        if (id !== requestId.current) return;
        setGamesData(json);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err.message || "โหลดไม่สำเร็จ");
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
  }, [difficulty, page, initialDifficulty]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
    setPage(1);
  }

  const stat =
    statsByDifficulty[difficulty] ||
    statsByDifficulty[DEFAULT_DIFFICULTY] || {
      score: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
    };

  const pageGames = gamesData?.games || [];
  const totalPages = gamesData?.totalPages || 1;
  const safePage = Math.min(page, totalPages);

  const values = {
    score: stat.score,
    bonus: totalBonus(stat.score, stat.wins, stat.losses),
    wins: stat.wins,
    losses: stat.losses,
    draws: stat.draws,
    winRate: formatWinRate(stat.wins, stat.losses, stat.draws),
    winStreak: stat.winStreak,
  };

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-teal-300 sm:text-4xl">
            {user.name || "Player"}
          </h1>
          <p className="mt-1 break-all text-sm text-slate-400 sm:text-base">
            {user.email}
          </p>
        </div>

        <DifficultyDropdown value={difficulty} onChange={onSelectDifficulty} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-xl border p-3 sm:rounded-2xl sm:p-4 ${card.color}`}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
              {card.label}
            </p>
            <p className={`mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl ${card.valueClass}`}>
              {values[card.key]}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold sm:text-lg">Game History</h2>
        {error && (
          <p className="mb-2 text-center text-sm text-rose-300">{error}</p>
        )}
        <div
          className={`-mx-1 overflow-x-auto rounded-2xl border border-slate-700/70 sm:mx-0 ${
            loading ? "opacity-60" : ""
          }`}
        >
          <table className="min-w-[32rem] w-full text-left text-xs sm:min-w-full sm:text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">Result</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">Score Δ</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">Bonus</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">Streak</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {pageGames.map((game) => {
                const color = RESULT_STYLE[game.result] || "text-slate-200";
                return (
                  <tr key={game.id} className="border-t border-slate-800/80">
                    <td className={`whitespace-nowrap px-3 py-2.5 font-semibold sm:px-4 sm:py-3 ${color}`}>
                      {game.result}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2.5 font-semibold sm:px-4 sm:py-3 ${color}`}>
                      {game.scoreChange}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2.5 font-semibold sm:px-4 sm:py-3 ${color}`}>
                      {game.bonusScore}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
                      {game.winStreak}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-400 sm:px-4 sm:py-3">
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
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={safePage <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
                safePage <= 1 || loading
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
              disabled={safePage >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
                safePage >= totalPages || loading
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
