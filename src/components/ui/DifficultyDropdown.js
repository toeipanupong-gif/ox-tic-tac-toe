"use client";

import { useEffect, useRef, useState } from "react";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  DEFAULT_DIFFICULTY,
  readStoredDifficulty,
  writeStoredDifficulty,
} from "@/lib/game/difficulty";

const LEVEL_STYLE = {
  EASY: {
    accent: "text-emerald-300",
    active: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40",
  },
  NORMAL: {
    accent: "text-teal-300",
    active: "bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/40",
  },
  HARD: {
    accent: "text-amber-300",
    active: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40",
  },
};

export function useStoredDifficulty() {
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);

  useEffect(() => {
    setDifficulty(readStoredDifficulty());
  }, []);

  function selectDifficulty(level) {
    const next = writeStoredDifficulty(level);
    setDifficulty(next);
    return next;
  }

  return [difficulty, selectDifficulty];
}

export default function DifficultyDropdown({
  value,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentStyle = LEVEL_STYLE[value] || LEVEL_STYLE.NORMAL;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectLevel(level) {
    onChange?.(level);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative flex items-stretch gap-2 ${className}`}>
      <span className="flex items-center text-[10px] uppercase tracking-widest text-slate-400">
        ระดับ
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-w-[7.5rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-left transition hover:border-teal-500/50 ${currentStyle.accent}`}
      >
        <span className="text-sm font-semibold leading-tight">
          {DIFFICULTY_LABELS[value]}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-20 w-44 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur"
        >
          {DIFFICULTIES.map((level) => {
            const style = LEVEL_STYLE[level];
            const selected = level === value;
            return (
              <button
                key={level}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectLevel(level)}
                className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left transition ${
                  selected
                    ? style.active
                    : "text-slate-200 hover:bg-slate-800/80"
                }`}
              >
                <span className={`text-sm font-semibold ${selected ? "" : style.accent}`}>
                  {DIFFICULTY_LABELS[level]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
