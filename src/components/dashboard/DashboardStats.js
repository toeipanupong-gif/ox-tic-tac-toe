"use client";

import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { totalBonus } from "@/lib/game/score";

const STAT_META = [
  ["Score", "score", "text-cyan-300"],
  ["Bonus", "bonus", "text-violet-300"],
  ["Streak", "winStreak", "text-amber-300"],
  ["W", "wins", "text-teal-300"],
  ["L", "losses", "text-rose-300"],
  ["D", "draws", "text-slate-200"],
];

export default function DashboardStats({ statsByDifficulty }) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();

  const userStat =
    statsByDifficulty[difficulty] || statsByDifficulty[DEFAULT_DIFFICULTY];

  const values = {
    score: userStat?.score ?? 0,
    bonus: totalBonus(userStat?.score, userStat?.wins, userStat?.losses),
    winStreak: userStat?.winStreak ?? 0,
    wins: userStat?.wins ?? 0,
    losses: userStat?.losses ?? 0,
    draws: userStat?.draws ?? 0,
  };

  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:justify-end">
      <DifficultyDropdown value={difficulty} onChange={selectDifficulty} />

      {STAT_META.map(([label, key, color]) => (
        <div
          key={label}
          className="flex min-w-[4.25rem] scale-90 flex-col justify-center rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-center"
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className={`mt-0.5 text-xl font-semibold ${color}`}>
            {values[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
