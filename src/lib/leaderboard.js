import { decryptPii, isPiiEncrypted, maskLeaderboardName } from "@/lib/pii";

export { maskLeaderboardName };

/**
 * map แถว leaderboard
 * - คนอื่น: ใช้ maskedName จาก DB (ไม่ decrypt)
 * - ตัวเอง: decrypt name จริง
 * - legacy ไม่มี maskedName: decrypt แล้ว mask เป็น fallback
 */
export function mapLeaderboardPlayer(stat, { isSelf = false } = {}) {
  const user = stat.user || {};
  let displayName;

  if (isSelf) {
    const raw = user.name
      ? isPiiEncrypted(user.name)
        ? decryptPii(user.name)
        : user.name
      : "";
    displayName = raw?.trim() || "Player";
  } else if (user.maskedName?.trim()) {
    displayName = user.maskedName.trim();
  } else if (user.name) {
    const raw = isPiiEncrypted(user.name)
      ? decryptPii(user.name)
      : user.name;
    displayName = maskLeaderboardName(raw);
  } else {
    displayName = "Player";
  }

  return {
    id: user.id,
    name: displayName,
    score: stat.score,
    wins: stat.wins,
    losses: stat.losses,
    draws: stat.draws,
  };
}
