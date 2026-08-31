import { difficultyLabel } from "@/lib/game/difficulty";

function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

const RESULT_STYLE = {
  WIN: "text-teal-300",
  LOSS: "text-rose-300",
  DRAW: "text-slate-200",
};

export default function AdminPanel({
  users,
  totalGames,
  totalPlayers,
  recentGames = [],
  difficulty = "NORMAL",
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">ผู้เล่นทั้งหมด</p>
          <p className="mt-2 text-3xl font-semibold text-teal-300">{totalPlayers}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">เกม ({difficultyLabel(difficulty)})</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{totalGames}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
          <p className="text-sm text-slate-400">ระดับที่ดู</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">
            {difficultyLabel(difficulty)}
          </p>
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
                <td className="px-4 py-3 text-teal-300">{user.wins}</td>
                <td className="px-4 py-3 text-rose-300">{user.losses}</td>
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
        <h2 className="text-lg font-semibold text-slate-100">
          Game History — {difficultyLabel(difficulty)}
        </h2>
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
              {recentGames.map((game) => {
                const color = RESULT_STYLE[game.result] || "text-slate-200";
                return (
                  <tr key={game.id} className="border-t border-slate-800/80">
                    <td className="px-4 py-3">
                      {game.user?.name || game.user?.email || "-"}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.result}</td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.scoreChange}</td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.bonusScore}</td>
                    <td className="px-4 py-3">{game.winStreak}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(game.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                );
              })}
              {recentGames.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีประวัติเกมในระดับนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
