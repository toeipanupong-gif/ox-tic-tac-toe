"use client";

import { useEffect, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";

const PAGE_SIZE = 10;

export default function LeaderboardView({
  rankedByDifficulty,
  currentUserId,
}) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();
  const [page, setPage] = useState(1);

  const ranked =
    rankedByDifficulty[difficulty] ||
    rankedByDifficulty[DEFAULT_DIFFICULTY] ||
    [];

  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const pagePlayers = ranked.slice(pageOffset, pageOffset + PAGE_SIZE);

  const selfIndex = currentUserId
    ? ranked.findIndex((p) => p.id === currentUserId)
    : -1;
  const selfOnPage =
    selfIndex >= pageOffset && selfIndex < pageOffset + PAGE_SIZE;
  const selfPlayer = selfIndex >= 0 ? ranked[selfIndex] : null;

  useEffect(() => {
    setPage(1);
  }, [difficulty]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <DifficultyDropdown value={difficulty} onChange={onSelectDifficulty} />

      <LeaderboardTable
        players={pagePlayers}
        currentUserId={currentUserId}
        selfPlayer={selfPlayer}
        selfRank={selfIndex >= 0 ? selfIndex + 1 : null}
        showSelfOutside={Boolean(selfPlayer && !selfOnPage)}
        pageOffset={pageOffset}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
              safePage <= 1
                ? "pointer-events-none opacity-40"
                : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
            }`}
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-slate-400">
            หน้า {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
              safePage >= totalPages
                ? "pointer-events-none opacity-40"
                : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
            }`}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
