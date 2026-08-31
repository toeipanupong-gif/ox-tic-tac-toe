function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function LeaderboardTable({ players }) {
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
          {players.map((player, index) => (
            <tr key={player.id} className="border-t border-slate-800/80">
              <td className="px-4 py-3 text-teal-300">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {player.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.image}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-700" />
                  )}
                  <span>{player.name || player.email}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-cyan-300">{player.score}</td>
              <td className="px-4 py-3">{player.wins}</td>
              <td className="px-4 py-3">{player.losses}</td>
              <td className="px-4 py-3">
                {winRate(player.wins, player.losses, player.draws)}
              </td>
            </tr>
          ))}
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
