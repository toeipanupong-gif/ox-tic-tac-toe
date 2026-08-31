"use client";

import { useEffect, useMemo, useState } from "react";
import DifficultyDropdown, {
  useStoredDifficulty,
} from "@/components/ui/DifficultyDropdown";
import SelectDropdown from "@/components/ui/SelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  DEFAULT_DIFFICULTY,
  difficultyLabel,
} from "@/lib/game/difficulty";

const PAGE_SIZE = 10;

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

function winRate(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return (wins / total) * 100;
}

function winRateLabel(wins, losses, draws) {
  return `${winRate(wins, losses, draws).toFixed(1)}%`;
}

function compareValues(a, b, dir) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") {
    const cmp = a.localeCompare(b, "th", { sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  }
  if (a < b) return dir === "asc" ? -1 : 1;
  if (a > b) return dir === "asc" ? 1 : -1;
  return 0;
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

function ClientPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const safePage = Math.min(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        disabled={safePage <= 1}
        onClick={() => onChange(Math.max(1, safePage - 1))}
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
        onClick={() => onChange(Math.min(totalPages, safePage + 1))}
        className={`cursor-pointer rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm ${
          safePage >= totalPages
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

function dayStart(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function dayEnd(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export default function AdminPanel({
  usersByDifficulty,
  totalGamesByDifficulty,
  totalPlayers,
  gamesByDifficulty,
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

  const users =
    usersByDifficulty[difficulty] ||
    usersByDifficulty[DEFAULT_DIFFICULTY] ||
    [];
  const recentGames =
    gamesByDifficulty[difficulty] ||
    gamesByDifficulty[DEFAULT_DIFFICULTY] ||
    [];
  const totalGames =
    totalGamesByDifficulty[difficulty] ??
    totalGamesByDifficulty[DEFAULT_DIFFICULTY] ??
    0;

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    let list = users.filter((user) => {
      if (playerRole !== "ALL" && user.role !== playerRole) return false;
      if (!q) return true;
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });

    list = [...list].sort((a, b) => {
      const key = playerSort.key;
      let av;
      let bv;
      switch (key) {
        case "player":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "email":
          av = a.email || "";
          bv = b.email || "";
          break;
        case "role":
          av = a.role || "";
          bv = b.role || "";
          break;
        case "score":
          av = a.score;
          bv = b.score;
          break;
        case "wins":
          av = a.wins;
          bv = b.wins;
          break;
        case "losses":
          av = a.losses;
          bv = b.losses;
          break;
        case "draws":
          av = a.draws;
          bv = b.draws;
          break;
        case "winStreak":
          av = a.winStreak;
          bv = b.winStreak;
          break;
        case "winRate":
          av = winRate(a.wins, a.losses, a.draws);
          bv = winRate(b.wins, b.losses, b.draws);
          break;
        default:
          av = a.score;
          bv = b.score;
      }
      return compareValues(av, bv, playerSort.dir);
    });

    return list;
  }, [users, playerSearch, playerRole, playerSort]);

  const filteredGames = useMemo(() => {
    const q = gameSearch.trim().toLowerCase();
    const fromTs = dayStart(dateFrom);
    const toTs = dayEnd(dateTo);

    let list = recentGames.filter((game) => {
      if (gameResult !== "ALL" && game.result !== gameResult) return false;

      if (q) {
        const name = (game.user?.name || "").toLowerCase();
        if (!name.includes(q)) return false;
      }

      const ts = new Date(game.createdAt).getTime();
      if (fromTs != null && ts < fromTs) return false;
      if (toTs != null && ts > toTs) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const key = gameSort.key;
      let av;
      let bv;
      switch (key) {
        case "player":
          av = a.user?.name || a.user?.email || "";
          bv = b.user?.name || b.user?.email || "";
          break;
        case "result":
          av = a.result || "";
          bv = b.result || "";
          break;
        case "scoreChange":
          av = a.scoreChange;
          bv = b.scoreChange;
          break;
        case "bonusScore":
          av = a.bonusScore;
          bv = b.bonusScore;
          break;
        case "winStreak":
          av = a.winStreak;
          bv = b.winStreak;
          break;
        case "when":
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
          break;
        default:
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
      }
      return compareValues(av, bv, gameSort.dir);
    });

    return list;
  }, [recentGames, gameSearch, gameResult, dateFrom, dateTo, gameSort]);

  const playerTotalPages = Math.max(
    1,
    Math.ceil(filteredPlayers.length / PAGE_SIZE)
  );
  const gameTotalPages = Math.max(
    1,
    Math.ceil(filteredGames.length / PAGE_SIZE)
  );
  const safePlayerPage = Math.min(playerPage, playerTotalPages);
  const safeGamePage = Math.min(gamePage, gameTotalPages);

  const pagePlayers = filteredPlayers.slice(
    (safePlayerPage - 1) * PAGE_SIZE,
    safePlayerPage * PAGE_SIZE
  );
  const pageGames = filteredGames.slice(
    (safeGamePage - 1) * PAGE_SIZE,
    safeGamePage * PAGE_SIZE
  );

  useEffect(() => {
    setPlayerPage(1);
    setGamePage(1);
  }, [difficulty]);

  useEffect(() => {
    setPlayerPage(1);
  }, [playerSearch, playerRole, playerSort]);

  useEffect(() => {
    setGamePage(1);
  }, [gameSearch, gameResult, dateFrom, dateTo, gameSort]);

  function onSelectDifficulty(level) {
    selectDifficulty(level);
  }

  function togglePlayerSort(key) {
    setPlayerSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "player" || key === "email" || key === "role" ? "asc" : "desc" }
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

        <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
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

        <div className="overflow-x-auto rounded-2xl border border-slate-700/70">
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
        />
      </section>
    </div>
  );
}
