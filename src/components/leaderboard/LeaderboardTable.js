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

export default function LeaderboardTable({ players, currentUserId = null }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Wins</th>
            <th className="px-4 py-3 font-medium">Losses</th>
            <th className="px-4 py-3 font-medium">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const isSelf = Boolean(currentUserId && player.id === currentUserId);
            return (
              <tr
                key={player.id}
                className={`border-t border-slate-800/80 ${isSelf ? "bg-teal-950/30" : ""}`}
              >
                <td className="px-4 py-3 text-teal-300">{index + 1}</td>
                <td className="px-4 py-3">
                  <span className={isSelf ? "font-semibold text-teal-200" : ""}>
                    {displayName(player, isSelf)}
                    {isSelf ? " (คุณ)" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-cyan-300">{player.score}</td>
                <td className="px-4 py-3">{player.wins}</td>
                <td className="px-4 py-3">{player.losses}</td>
                <td className="px-4 py-3">
                  {winRate(player.wins, player.losses, player.draws)}
                </td>
              </tr>
            );
          })}
          {players.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                ยังไม่มีผู้เล่นใน Leaderboard
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
