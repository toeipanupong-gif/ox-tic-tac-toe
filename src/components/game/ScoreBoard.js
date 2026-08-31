export default function ScoreBoard({ score, winStreak, status, turn, botThinking }) {
  const statusLabel = botThinking
    ? "Bot กำลังคิด..."
    : {
        PLAYING: turn === "PLAYER" ? "ตาของคุณ" : "Bot กำลังคิด...",
        WIN: "คุณชนะ!",
        LOSS: "Bot ชนะ",
        DRAW: "เสมอ",
      }[status] || status;

  return (
    <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
      <div className="rounded-xl bg-slate-900/70 px-2 py-3 sm:rounded-2xl sm:px-3 sm:py-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
          Score
        </p>
        <p className="mt-1 text-xl font-semibold text-cyan-300 sm:text-2xl">
          {score}
        </p>
      </div>
      <div className="rounded-xl bg-slate-900/70 px-2 py-3 sm:rounded-2xl sm:px-3 sm:py-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
          Streak
        </p>
        <p className="mt-1 text-xl font-semibold text-amber-300 sm:text-2xl">
          {winStreak}
        </p>
      </div>
      <div className="rounded-xl bg-slate-900/70 px-2 py-3 sm:rounded-2xl sm:px-3 sm:py-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
          Status
        </p>
        <p
          className={`mt-1 text-xs font-semibold leading-snug text-teal-200 sm:text-sm ${
            botThinking ? "bot-thinking-label" : ""
          }`}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
