"use client";

import { useEffect, useRef, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { DEFAULT_DIFFICULTY } from "@/lib/game/difficulty";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

async function fetchLeaderboard(difficulty, page) {
  const params = new URLSearchParams({
    difficulty,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const res = await fetch(`/api/leaderboard?${params}`);
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}

export default function LeaderboardView({
  initialDifficulty = DEFAULT_DIFFICULTY,
  initialData,
}) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const skipFirst = useRef(
    difficulty === initialDifficulty // true only until hydration may change it
  );
  const requestId = useRef(0);

  useEffect(() => {
    // ข้ามครั้งแรกถ้ายังตรงกับข้อมูล SSR
    if (skipFirst.current && difficulty === initialDifficulty && page === 1) {
      skipFirst.current = false;
      return;
    }
    skipFirst.current = false;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    fetchLeaderboard(difficulty, page)
      .then((json) => {
        if (id !== requestId.current) return;
        setData(json);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err.message || "โหลดไม่สำเร็จ");
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
  }, [difficulty, page, initialDifficulty]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
    setPage(1);
  }

  const players = data?.players || [];
  const totalPages = data?.totalPages || 1;
  const safePage = Math.min(page, totalPages);
  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const currentUserId = data?.currentUserId ?? null;
  const selfPlayer = data?.self?.player ?? null;
  const selfRank = data?.self?.rank ?? null;
  const selfOnPage = Boolean(
    selfPlayer && players.some((p) => p.id === selfPlayer.id)
  );

  return (
    <div className="space-y-6 overflow-visible">
      <div className="relative z-30 flex justify-start overflow-visible sm:justify-end">
        <DifficultyDropdown value={difficulty} onChange={onSelectDifficulty} />
      </div>

      {error && (
        <p className="text-center text-sm text-rose-300">{error}</p>
      )}

      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        <LeaderboardTable
          players={players}
          currentUserId={currentUserId}
          selfPlayer={selfPlayer}
          selfRank={selfRank}
          showSelfOutside={Boolean(selfPlayer && !selfOnPage)}
          pageOffset={pageOffset}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={safePage <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
              safePage <= 1 || loading
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
            disabled={safePage >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
              safePage >= totalPages || loading
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
