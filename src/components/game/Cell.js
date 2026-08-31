"use client";

export default function Cell({ value, onClick, disabled, highlight }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || Boolean(value)}
      className={`aspect-square rounded-xl border text-4xl font-bold transition duration-200 sm:text-5xl ${
        highlight
          ? "border-teal-400 bg-teal-500/20 text-teal-200"
          : "border-slate-600/80 bg-slate-900/60 text-slate-100 hover:border-teal-500/60 hover:bg-slate-800/80"
      } disabled:cursor-not-allowed disabled:opacity-80`}
      aria-label={value ? `Cell ${value}` : "Empty cell"}
    >
      <span className={value === "X" ? "text-cyan-300" : value === "O" ? "text-amber-300" : ""}>
        {value ?? ""}
      </span>
    </button>
  );
}
