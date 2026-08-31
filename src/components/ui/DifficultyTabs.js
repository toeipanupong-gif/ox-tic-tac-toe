"use client";

import Link from "next/link";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/game/difficulty";

export default function DifficultyTabs({
  current,
  basePath,
  extraParams = {},
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIFFICULTIES.map((level) => {
        const active = current === level;
        const params = new URLSearchParams({
          ...extraParams,
          difficulty: level,
        });
        const href = `${basePath}?${params.toString()}`;
        return (
          <Link
            key={level}
            href={href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-teal-500 text-slate-950"
                : "border border-slate-700/70 bg-slate-900/50 text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
            }`}
          >
            {DIFFICULTY_LABELS[level]}
          </Link>
        );
      })}
    </div>
  );
}
