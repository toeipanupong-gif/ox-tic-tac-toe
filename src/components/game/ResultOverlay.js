"use client";

const RESULT_META = {
  WIN: {
    title: "คุณชนะ!",
    subtitle: "Nice move",
    className: "result-overlay-win",
    titleClass: "text-teal-300",
  },
  LOSS: {
    title: "Bot ชนะ",
    subtitle: "ลองใหม่นะ",
    className: "result-overlay-loss",
    titleClass: "text-rose-300",
  },
  DRAW: {
    title: "เสมอ!",
    subtitle: "สูสีมาก",
    className: "result-overlay-draw",
    titleClass: "text-slate-100",
  },
};

export default function ResultOverlay({ status, scoreResult, onClose }) {
  const meta = RESULT_META[status];
  if (!meta) return null;

  return (
    <div
      className="result-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      onClick={onClose}
    >
      <div
        className={`result-overlay-card ${meta.className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`font-[family-name:var(--font-display)] text-4xl font-extrabold sm:text-5xl ${meta.titleClass}`}>
          {meta.title}
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
          {meta.subtitle}
        </p>
        {scoreResult && (
          <p className="mt-4 text-lg font-semibold text-cyan-200">
            คะแนน {scoreResult.nextScoreDelta >= 0 ? "+" : ""}
            {scoreResult.nextScoreDelta}
            {scoreResult.bonusScore > 0
              ? ` ( Bonus +${scoreResult.bonusScore} )`
              : ""}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 cursor-pointer rounded-xl border border-slate-600/80 bg-slate-900/80 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-teal-500/50 hover:text-teal-200"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
