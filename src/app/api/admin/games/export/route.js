import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty, difficultyLabel } from "@/lib/game/difficulty";
import { excelDownloadResponse } from "@/lib/excel";
import { ADMIN_EXPORT_ROW_LIMIT } from "@/lib/admin-limits";
import { maskEmail, maskName, revealUserPii } from "@/lib/pii";

const SORT_FIELDS = new Set([
  "player",
  "result",
  "scoreChange",
  "bonusScore",
  "winStreak",
  "when",
]);

const RESULT_VALUES = new Set(["WIN", "LOSS", "DRAW"]);

function dayStart(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayEnd(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function orderByFor(sortKey, dir) {
  const direction = dir === "asc" ? "asc" : "desc";
  switch (sortKey) {
    case "player":
      return { createdAt: direction };
    case "result":
      return { result: direction };
    case "scoreChange":
      return { scoreChange: direction };
    case "bonusScore":
      return { bonusScore: direction };
    case "winStreak":
      return { winStreak: direction };
    case "when":
    default:
      return { createdAt: direction };
  }
}

function matchesPlayerSearch(user, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const name = (user?.name || "").toLowerCase();
  const email = (user?.email || "").toLowerCase();
  return name.includes(needle) || email.includes(needle);
}

async function loadAllGames({
  difficulty,
  search,
  resultFilter,
  from,
  to,
  sortKey,
  dir,
}) {
  const where = { difficulty };

  if (RESULT_VALUES.has(resultFilter)) {
    where.result = resultFilter;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const needsInMemory = Boolean(search) || sortKey === "player";

  const games = await prisma.game.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: needsInMemory
      ? orderByFor("when", "desc")
      : orderByFor(sortKey, dir),
    take: ADMIN_EXPORT_ROW_LIMIT,
  });

  let items = games.map((g) => ({
    id: g.id,
    result: g.result,
    scoreChange: g.scoreChange,
    bonusScore: g.bonusScore,
    winStreak: g.winStreak,
    createdAt: g.createdAt.toISOString(),
    user: revealUserPii(g.user),
  }));

  if (search) {
    items = items.filter((g) => matchesPlayerSearch(g.user, search));
  }

  if (needsInMemory) {
    if (sortKey === "player") {
      const mul = dir === "asc" ? 1 : -1;
      items.sort(
        (a, b) =>
          mul * (a.user?.name || "").localeCompare(b.user?.name || "", "th")
      );
    } else {
      const mul = dir === "asc" ? 1 : -1;
      const key =
        sortKey === "when"
          ? "createdAt"
          : sortKey === "scoreChange"
            ? "scoreChange"
            : sortKey === "bonusScore"
              ? "bonusScore"
              : sortKey === "winStreak"
                ? "winStreak"
                : sortKey === "result"
                  ? "result"
                  : "createdAt";
      items.sort((a, b) => {
        if (key === "createdAt" || key === "result") {
          return mul * String(a[key]).localeCompare(String(b[key]));
        }
        return mul * (a[key] - b[key]);
      });
    }
  }

  return items;
}

function playerLabel(user) {
  if (user?.name) return maskName(user.name);
  if (user?.email) return maskEmail(user.email);
  return "-";
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const search = (searchParams.get("search") || "").trim();
  const resultFilter = (searchParams.get("result") || "ALL").toUpperCase();
  const from = dayStart(searchParams.get("from") || "");
  const to = dayEnd(searchParams.get("to") || "");
  const sortKey = SORT_FIELDS.has(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "when";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const games = await loadAllGames({
    difficulty,
    search,
    resultFilter,
    from,
    to,
    sortKey,
    dir,
  });

  const headers = [
    "Player",
    "Result",
    "Score Δ",
    "Bonus",
    "Streak",
    "When",
  ];

  const rows = games.map((g) => [
    playerLabel(g.user),
    g.result,
    g.scoreChange,
    g.bonusScore,
    g.winStreak,
    new Date(g.createdAt).toLocaleString("th-TH"),
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  const level = difficultyLabel(difficulty).toLowerCase();
  return excelDownloadResponse(
    `game-history-${level}-${stamp}.xlsx`,
    "Game History",
    headers,
    rows
  );
}
