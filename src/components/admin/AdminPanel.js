function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export default function AdminPanel({ users, totalGames, totalPlayers }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">ผู้เล่นทั้งหมด</p>
          <p className="mt-2 text-3xl font-semibold text-teal-300">{totalPlayers}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">เกมทั้งหมด</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{totalGames}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">L</th>
              <th className="px-4 py-3">D</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-800/80 align-top">
                <td className="px-4 py-3">{user.name || "-"}</td>
                <td className="px-4 py-3 text-slate-400">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3 text-cyan-300">{user.score}</td>
                <td className="px-4 py-3">{user.wins}</td>
                <td className="px-4 py-3">{user.losses}</td>
                <td className="px-4 py-3">{user.draws}</td>
                <td className="px-4 py-3">{user.winStreak}</td>
                <td className="px-4 py-3">
                  {winRate(user.wins, user.losses, user.draws)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Game History (ล่าสุด)</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Score Δ</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {users
                .flatMap((user) =>
                  (user.games || []).map((game) => ({
                    ...game,
                    playerName: user.name || user.email,
                  }))
                )
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 50)
                .map((game) => (
                  <tr key={game.id} className="border-t border-slate-800/80">
                    <td className="px-4 py-3">{game.playerName}</td>
                    <td className="px-4 py-3">{game.result}</td>
                    <td className="px-4 py-3">{game.scoreChange}</td>
                    <td className="px-4 py-3">{game.bonusScore}</td>
                    <td className="px-4 py-3">{game.winStreak}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(game.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
