"use client";

import { totalBonus } from "@/lib/game/score";

function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

function maskName(name) {
  if (!name?.trim()) return "Player";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return "*";
      return `${word[0]}${"*".repeat(Math.min(3, word.length - 1))}`;
    })
    .join(" ");
}

function displayName(player, isSelf) {
  if (isSelf) return player.name || player.email || "Player";
  if (!player.name) return "Player";
  return maskName(player.name);
}

function PlayerRow({ player, rank, isSelf }) {
  return (
    <tr
      className={`border-t border-slate-800/80 ${isSelf ? "bg-teal-950/40 ring-1 ring-inset ring-teal-500/30" : ""}`}
    >
      <td className="whitespace-nowrap px-3 py-2.5 text-teal-300 sm:px-4 sm:py-3">
        {rank}
      </td>
      <td className="max-w-[8rem] truncate px-3 py-2.5 sm:max-w-none sm:px-4 sm:py-3">
        <span className={isSelf ? "font-semibold text-teal-200" : ""}>
          {displayName(player, isSelf)}
          {isSelf ? " (คุณ)" : ""}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-cyan-300 sm:px-4 sm:py-3">
        {player.score}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-violet-300 sm:px-4 sm:py-3">
        {totalBonus(player.score, player.wins, player.losses)}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-teal-300 sm:px-4 sm:py-3">
        {player.wins}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-rose-300 sm:px-4 sm:py-3">
        {player.losses}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-slate-200 sm:px-4 sm:py-3">
        {player.draws}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3">
        {winRate(player.wins, player.losses, player.draws)}
      </td>
    </tr>
  );
}

function TableHead() {
  return (
    <thead className="bg-slate-900/80 text-slate-400">
      <tr>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Rank</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Player</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Score</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Bonus</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Wins</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Losses</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Draw</th>
        <th className="whitespace-nowrap px-3 py-2.5 font-medium sm:px-4 sm:py-3">Win Rate</th>
      </tr>
    </thead>
  );
}

export default function LeaderboardTable({
  players,
  currentUserId = null,
  selfPlayer = null,
  selfRank = null,
  showSelfOutside = false,
  pageOffset = 0,
}) {
  return (
    <div className="space-y-4">
      <div className="-mx-1 overflow-x-auto rounded-2xl border border-slate-700/70 sm:mx-0">
        <table className="min-w-[40rem] w-full text-left text-xs sm:min-w-full sm:text-sm">
          <TableHead />
          <tbody>
            {players.map((player, index) => {
              const isSelf = Boolean(currentUserId && player.id === currentUserId);
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  rank={pageOffset + index + 1}
                  isSelf={isSelf}
                />
              );
            })}
            {players.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีผู้เล่นใน Leaderboard
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showSelfOutside && selfPlayer && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">อันดับของคุณ (อยู่นอกหน้านี้)</p>
          <div className="-mx-1 overflow-x-auto rounded-2xl border border-teal-500/40 sm:mx-0">
            <table className="min-w-[40rem] w-full text-left text-xs sm:min-w-full sm:text-sm">
              <TableHead />
              <tbody>
                <PlayerRow
                  player={selfPlayer}
                  rank={selfRank}
                  isSelf
                />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
