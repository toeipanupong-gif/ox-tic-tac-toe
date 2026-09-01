"use client";

export default function RateLimitModal({
  message,
  retryAfterSeconds,
  onClose,
}) {
  return (
    <div
      className="result-overlay-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="rate-limit-title"
      onClick={onClose}
    >
      <div
        className="result-overlay-card result-overlay-draw border-amber-400/35"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="rate-limit-title"
          className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-amber-300 sm:text-3xl"
        >
          ช้าลงหน่อยนะ
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
          {message ||
            "คุณเล่นเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่"}
        </p>
        {retryAfterSeconds > 0 && (
          <p className="mt-2 text-sm text-slate-400">
            ลองใหม่ได้ในอีกประมาณ {retryAfterSeconds} วินาที
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 cursor-pointer rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}
