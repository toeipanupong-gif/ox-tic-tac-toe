import { revealUserPii } from "@/lib/pii";

/** Mask ชื่อสำหรับ leaderboard — ไม่ส่งชื่อจริงออก API (ยกเว้นแถวของตัวเอง) */
export function maskLeaderboardName(name) {
  if (!name?.trim()) return "Player";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return "*";
      return `${word[0]}${"*".repeat(Math.min(3, word.length - 1))}`;
    })
    .join(" ");
}

export function mapLeaderboardPlayer(stat, { isSelf = false } = {}) {
  const user = revealUserPii(stat.user);
  const rawName = user.name?.trim() || "";
  return {
    id: user.id,
    name: isSelf ? rawName || "Player" : maskLeaderboardName(rawName),
    score: stat.score,
    wins: stat.wins,
    losses: stat.losses,
    draws: stat.draws,
  };
}
