"use client";

import { useEffect, useRef, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import SelectDropdown from "@/components/ui/SelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  DEFAULT_DIFFICULTY,
  difficultyLabel,
} from "@/lib/game/difficulty";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;
const SEARCH_DEBOUNCE_MS = 300;

const RESULT_STYLE = {
  WIN: "text-teal-300",
  LOSS: "text-rose-300",
  DRAW: "text-slate-200",
};

const ROLE_OPTIONS = [
  { value: "ALL", label: "ทุก Role" },
  { value: "USER", label: "USER" },
  { value: "ADMIN", label: "ADMIN" },
];

const RESULT_OPTIONS = [
  { value: "ALL", label: "ทุกผล" },
  { value: "WIN", label: "WIN" },
  { value: "LOSS", label: "LOSS" },
  { value: "DRAW", label: "DRAW" },
];

function winRateLabel(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

function SortHeader({ label, sortKey, sort, onSort, className = "" }) {
  const active = sort.key === sortKey;
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex cursor-pointer items-center gap-1 transition hover:text-teal-200 ${
          active ? "text-teal-300" : "text-slate-400"
        }`}
      >
        {label}
        <span className="text-[10px] opacity-80" aria-hidden>
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function ClientPagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;
  const safePage = Math.min(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        disabled={safePage <= 1 || disabled}
        onClick={() => onChange(Math.max(1, safePage - 1))}
        className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
          safePage <= 1 || disabled
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
        disabled={safePage >= totalPages || disabled}
        onClick={() => onChange(Math.min(totalPages, safePage + 1))}
        className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
          safePage >= totalPages || disabled
            ? "pointer-events-none opacity-40"
            : "text-slate-300 hover:border-teal-500/50 hover:text-teal-200"
        }`}
      >
        ถัดไป
      </button>
    </div>
  );
}

function FilterInput({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-500/50 ${className}`}
    />
  );
}

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function fetchPlayers(params) {
  const qs = new URLSearchParams({
    difficulty: params.difficulty,
    page: String(params.page),
    pageSize: String(PAGE_SIZE),
    search: params.search,
    role: params.role,
    sort: params.sort.key,
    dir: params.sort.dir,
  });
  const res = await fetch(`/api/admin/players?${qs}`);
  if (!res.ok) throw new Error("Failed to load players");
  return res.json();
}

async function fetchGames(params) {
  const qs = new URLSearchParams({
    difficulty: params.difficulty,
    page: String(params.page),
    pageSize: String(PAGE_SIZE),
    search: params.search,
    result: params.result,
    from: params.from,
    to: params.to,
    sort: params.sort.key,
    dir: params.sort.dir,
  });
  const res = await fetch(`/api/admin/games?${qs}`);
  if (!res.ok) throw new Error("Failed to load games");
  return res.json();
}

async function fetchSummary(difficulty) {
  const qs = new URLSearchParams({ difficulty });
  const res = await fetch(`/api/admin/summary?${qs}`);
  if (!res.ok) throw new Error("Failed to load summary");
  return res.json();
}

export default function AdminPanel({
  initialDifficulty = DEFAULT_DIFFICULTY,
  initialSummary,
  initialPlayers,
  initialGames,
}) {
  const [difficulty, selectDifficulty] = useStoredDifficulty();

  const [playerSearch, setPlayerSearch] = useState("");
  const [playerRole, setPlayerRole] = useState("ALL");
  const [playerSort, setPlayerSort] = useState({ key: "score", dir: "desc" });
  const [playerPage, setPlayerPage] = useState(1);

  const [gameSearch, setGameSearch] = useState("");
  const [gameResult, setGameResult] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [gameSort, setGameSort] = useState({ key: "when", dir: "desc" });
  const [gamePage, setGamePage] = useState(1);

  const debouncedPlayerSearch = useDebouncedValue(
    playerSearch,
    SEARCH_DEBOUNCE_MS
  );
  const debouncedGameSearch = useDebouncedValue(gameSearch, SEARCH_DEBOUNCE_MS);

  const [summary, setSummary] = useState(initialSummary);
  const [playersData, setPlayersData] = useState(initialPlayers);
  const [gamesData, setGamesData] = useState(initialGames);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);

  const skipPlayersFirst = useRef(true);
  const skipGamesFirst = useRef(true);
  const skipSummaryFirst = useRef(true);
  const playersReq = useRef(0);
  const gamesReq = useRef(0);
  const summaryReq = useRef(0);
  const playerFilterKey = useRef("");
  const gameFilterKey = useRef("");

  const nextPlayerFilterKey = [
    difficulty,
    debouncedPlayerSearch,
    playerRole,
    playerSort.key,
    playerSort.dir,
  ].join("|");

  const nextGameFilterKey = [
    difficulty,
    debouncedGameSearch,
    gameResult,
    dateFrom,
    dateTo,
    gameSort.key,
    gameSort.dir,
  ].join("|");

  useEffect(() => {
    if (skipSummaryFirst.current && difficulty === initialDifficulty) {
      skipSummaryFirst.current = false;
      return;
    }
    skipSummaryFirst.current = false;

    const id = ++summaryReq.current;
    fetchSummary(difficulty)
      .then((nextSummary) => {
        if (id !== summaryReq.current) return;
        setSummary({
          totalPlayers: nextSummary.totalPlayers,
          totalGames: nextSummary.totalGames,
        });
      })
      .catch(() => {
        if (id !== summaryReq.current) return;
      });
  }, [difficulty, initialDifficulty]);

  useEffect(() => {
    let page = playerPage;
    if (playerFilterKey.current !== nextPlayerFilterKey) {
      playerFilterKey.current = nextPlayerFilterKey;
      if (playerPage !== 1) {
        setPlayerPage(1);
        return;
      }
      page = 1;
    }

    if (
      skipPlayersFirst.current &&
      difficulty === initialDifficulty &&
      page === 1 &&
      debouncedPlayerSearch === "" &&
      playerRole === "ALL" &&
      playerSort.key === "score" &&
      playerSort.dir === "desc"
    ) {
      skipPlayersFirst.current = false;
      return;
    }
    skipPlayersFirst.current = false;

    const id = ++playersReq.current;
    setPlayersLoading(true);

    fetchPlayers({
      difficulty,
      page,
      search: debouncedPlayerSearch,
      role: playerRole,
      sort: playerSort,
    })
      .then((players) => {
        if (id !== playersReq.current) return;
        setPlayersData(players);
      })
      .catch(() => {
        if (id !== playersReq.current) return;
      })
      .finally(() => {
        if (id !== playersReq.current) return;
        setPlayersLoading(false);
      });
  }, [
    difficulty,
    playerPage,
    debouncedPlayerSearch,
    playerRole,
    playerSort,
    initialDifficulty,
    nextPlayerFilterKey,
  ]);

  useEffect(() => {
    let page = gamePage;
    if (gameFilterKey.current !== nextGameFilterKey) {
      gameFilterKey.current = nextGameFilterKey;
      if (gamePage !== 1) {
        setGamePage(1);
        return;
      }
      page = 1;
    }

    if (
      skipGamesFirst.current &&
      difficulty === initialDifficulty &&
      page === 1 &&
      debouncedGameSearch === "" &&
      gameResult === "ALL" &&
      dateFrom === "" &&
      dateTo === "" &&
      gameSort.key === "when" &&
      gameSort.dir === "desc"
    ) {
      skipGamesFirst.current = false;
      return;
    }
    skipGamesFirst.current = false;

    const id = ++gamesReq.current;
    setGamesLoading(true);

    fetchGames({
      difficulty,
      page,
      search: debouncedGameSearch,
      result: gameResult,
      from: dateFrom,
      to: dateTo,
      sort: gameSort,
    })
      .then((games) => {
        if (id !== gamesReq.current) return;
        setGamesData(games);
      })
      .catch(() => {
        if (id !== gamesReq.current) return;
      })
      .finally(() => {
        if (id !== gamesReq.current) return;
        setGamesLoading(false);
      });
  }, [
    difficulty,
    gamePage,
    debouncedGameSearch,
    gameResult,
    dateFrom,
    dateTo,
    gameSort,
    initialDifficulty,
    nextGameFilterKey,
  ]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
  }

  function togglePlayerSort(key) {
    setPlayerSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : {
            key,
            dir:
              key === "player" || key === "email" || key === "role"
                ? "asc"
                : "desc",
          }
    );
  }

  function toggleGameSort(key) {
    setGameSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "player" || key === "result" ? "asc" : "desc" }
    );
  }

  const playerFilterActive =
    playerSearch.trim() !== "" || playerRole !== "ALL";
  const gameFilterActive =
    gameSearch.trim() !== "" ||
    gameResult !== "ALL" ||
    dateFrom !== "" ||
    dateTo !== "";

  function clearPlayerFilters() {
    setPlayerSearch("");
    setPlayerRole("ALL");
    setPlayerPage(1);
  }

  function clearGameFilters() {
    setGameSearch("");
    setGameResult("ALL");
    setDateFrom("");
    setDateTo("");
    setGamePage(1);
  }

  const pagePlayers = playersData?.players || [];
  const playerTotalPages = playersData?.totalPages || 1;
  const safePlayerPage = Math.min(playerPage, playerTotalPages);

  const pageGames = gamesData?.games || [];
  const gameTotalPages = gamesData?.totalPages || 1;
  const safeGamePage = Math.min(gamePage, gameTotalPages);

  const totalPlayers = summary?.totalPlayers ?? 0;
  const totalGames = summary?.totalGames ?? 0;

  return (
    <div className="space-y-8 overflow-visible">
      <div className="relative z-30 flex justify-end overflow-visible">
        <DifficultyDropdown value={difficulty} onChange={onSelectDifficulty} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">ผู้เล่นทั้งหมด</p>
          <p className="mt-2 text-3xl font-semibold text-teal-300">{totalPlayers}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">เกม ({difficultyLabel(difficulty)})</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{totalGames}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
          <p className="text-sm text-slate-400">ระดับที่ดู</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">
            {difficultyLabel(difficulty)}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Players</h2>

        <div className="relative z-20 flex flex-wrap items-center gap-3">
          <FilterInput
            value={playerSearch}
            onChange={setPlayerSearch}
            placeholder="ค้นหาชื่อหรืออีเมล"
            className="min-w-[14rem] flex-1"
          />
          <SelectDropdown
            value={playerRole}
            onChange={setPlayerRole}
            options={ROLE_OPTIONS}
          />
          {playerFilterActive && (
            <button
              type="button"
              onClick={clearPlayerFilters}
              className="cursor-pointer rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-500/40 hover:text-rose-200"
            >
              Clear filter
            </button>
          )}
        </div>

        <div
          className={`overflow-x-auto rounded-2xl border border-slate-700/70 ${
            playersLoading ? "opacity-60" : ""
          }`}
        >
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <SortHeader label="Player" sortKey="player" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="Email" sortKey="email" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="Role" sortKey="role" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="Score" sortKey="score" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="W" sortKey="wins" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="L" sortKey="losses" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="D" sortKey="draws" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="Streak" sortKey="winStreak" sort={playerSort} onSort={togglePlayerSort} />
                <SortHeader label="Win Rate" sortKey="winRate" sort={playerSort} onSort={togglePlayerSort} />
              </tr>
            </thead>
            <tbody>
              {pagePlayers.map((user) => (
                <tr key={user.id} className="border-t border-slate-800/80 align-top">
                  <td className="px-4 py-3">{user.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3 text-cyan-300">{user.score}</td>
                  <td className="px-4 py-3 text-teal-300">{user.wins}</td>
                  <td className="px-4 py-3 text-rose-300">{user.losses}</td>
                  <td className="px-4 py-3">{user.draws}</td>
                  <td className="px-4 py-3">{user.winStreak}</td>
                  <td className="px-4 py-3">
                    {winRateLabel(user.wins, user.losses, user.draws)}
                  </td>
                </tr>
              ))}
              {pagePlayers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบผู้เล่นที่ตรงเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ClientPagination
          page={safePlayerPage}
          totalPages={playerTotalPages}
          onChange={setPlayerPage}
          disabled={playersLoading}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">
          Game History — {difficultyLabel(difficulty)}
        </h2>

        <div className="relative z-20 flex flex-wrap items-center gap-3">
          <FilterInput
            value={gameSearch}
            onChange={setGameSearch}
            placeholder="ค้นหาชื่อผู้เล่น"
            className="min-w-[12rem] flex-1"
          />
          <SelectDropdown
            value={gameResult}
            onChange={setGameResult}
            options={RESULT_OPTIONS}
          />
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={({ from, to }) => {
              setDateFrom(from);
              setDateTo(to);
            }}
          />
          {gameFilterActive && (
            <button
              type="button"
              onClick={clearGameFilters}
              className="cursor-pointer rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-500/40 hover:text-rose-200"
            >
              Clear filter
            </button>
          )}
        </div>

        <div
          className={`overflow-x-auto rounded-2xl border border-slate-700/70 ${
            gamesLoading ? "opacity-60" : ""
          }`}
        >
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <SortHeader label="Player" sortKey="player" sort={gameSort} onSort={toggleGameSort} />
                <SortHeader label="Result" sortKey="result" sort={gameSort} onSort={toggleGameSort} />
                <SortHeader label="Score Δ" sortKey="scoreChange" sort={gameSort} onSort={toggleGameSort} />
                <SortHeader label="Bonus" sortKey="bonusScore" sort={gameSort} onSort={toggleGameSort} />
                <SortHeader label="Streak" sortKey="winStreak" sort={gameSort} onSort={toggleGameSort} />
                <SortHeader label="When" sortKey="when" sort={gameSort} onSort={toggleGameSort} />
              </tr>
            </thead>
            <tbody>
              {pageGames.map((game) => {
                const color = RESULT_STYLE[game.result] || "text-slate-200";
                return (
                  <tr key={game.id} className="border-t border-slate-800/80">
                    <td className="px-4 py-3">
                      {game.user?.name || game.user?.email || "-"}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.result}</td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.scoreChange}</td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>{game.bonusScore}</td>
                    <td className="px-4 py-3">{game.winStreak}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(game.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                );
              })}
              {pageGames.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบประวัติเกมที่ตรงเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ClientPagination
          page={safeGamePage}
          totalPages={gameTotalPages}
          onChange={setGamePage}
          disabled={gamesLoading}
        />
      </section>
    </div>
  );
}
