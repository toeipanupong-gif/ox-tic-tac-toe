export default function ScoreBoard({ score, winStreak, status, turn }) {
  const statusLabel = {
    PLAYING: turn === "PLAYER" ? "ตาของคุณ" : "Bot กำลังคิด...",
    WIN: "คุณชนะ!",
    LOSS: "Bot ชนะ",
    DRAW: "เสมอ",
  }[status] || status;

  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="rounded-2xl bg-slate-900/70 px-3 py-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Score</p>
        <p className="mt-1 text-2xl font-semibold text-cyan-300">{score}</p>
      </div>
      <div className="rounded-2xl bg-slate-900/70 px-3 py-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Streak</p>
        <p className="mt-1 text-2xl font-semibold text-amber-300">{winStreak}</p>
      </div>
      <div className="rounded-2xl bg-slate-900/70 px-3 py-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
        <p className="mt-1 text-sm font-semibold text-teal-200">{statusLabel}</p>
      </div>
    </div>
  );
}
