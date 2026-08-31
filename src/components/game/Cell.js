"use client";

export default function Cell({ value, onClick, disabled, highlight, animate }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || Boolean(value)}
      className={`aspect-square rounded-xl border text-4xl font-bold transition duration-200 sm:text-5xl ${
        highlight
          ? "border-teal-400 bg-teal-500/20 text-teal-200 cell-win-glow"
          : "border-slate-600/80 bg-slate-900/60 text-slate-100 hover:border-teal-500/60 hover:bg-slate-800/80"
      } disabled:cursor-not-allowed disabled:opacity-80`}
      aria-label={value ? `Cell ${value}` : "Empty cell"}
    >
      {value ? (
        <span
          className={`mark-pop inline-block ${
            value === "X" ? "text-cyan-300" : "text-amber-300"
          } ${animate ? "mark-pop-active" : ""}`}
        >
          {value}
        </span>
      ) : null}
    </button>
  );
}
