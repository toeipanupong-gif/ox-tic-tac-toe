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
      <td className="px-4 py-3 text-teal-300">{rank}</td>
      <td className="px-4 py-3">
        <span className={isSelf ? "font-semibold text-teal-200" : ""}>
          {displayName(player, isSelf)}
          {isSelf ? " (คุณ)" : ""}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-cyan-300">{player.score}</td>
      <td className="px-4 py-3 text-violet-300">
        {totalBonus(player.score, player.wins, player.losses)}
      </td>
      <td className="px-4 py-3 text-teal-300">{player.wins}</td>
      <td className="px-4 py-3 text-rose-300">{player.losses}</td>
      <td className="px-4 py-3 text-slate-200">{player.draws}</td>
      <td className="px-4 py-3">
        {winRate(player.wins, player.losses, player.draws)}
      </td>
    </tr>
  );
}

function TableHead() {
  return (
    <thead className="bg-slate-900/80 text-slate-400">
      <tr>
        <th className="px-4 py-3 font-medium">Rank</th>
        <th className="px-4 py-3 font-medium">Player</th>
        <th className="px-4 py-3 font-medium">Score</th>
        <th className="px-4 py-3 font-medium">Bonus</th>
        <th className="px-4 py-3 font-medium">Wins</th>
        <th className="px-4 py-3 font-medium">Losses</th>
        <th className="px-4 py-3 font-medium">Draw</th>
        <th className="px-4 py-3 font-medium">Win Rate</th>
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
      <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
        <table className="min-w-full text-left text-sm">
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
          <div className="overflow-x-auto rounded-2xl border border-teal-500/40">
            <table className="min-w-full text-left text-sm">
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
