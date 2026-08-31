/**
 * Calculate score change from a finished game result.
 * @param {"WIN"|"LOSS"|"DRAW"} result
 * @param {number} currentStreak current win streak before this game
 * @returns {{ scoreChange: number, bonusScore: number, nextStreak: number, nextScoreDelta: number }}
 */
export function calculateScore(result, currentStreak = 0) {
  if (result === "WIN") {
    let nextStreak = currentStreak + 1;
    let scoreChange = 1;
    let bonusScore = 0;

    if (nextStreak === 3) {
      bonusScore = 1;
      nextStreak = 0;
    }

    return {
      scoreChange,
      bonusScore,
      nextStreak,
      nextScoreDelta: scoreChange + bonusScore,
    };
  }

  if (result === "LOSS") {
    return {
      scoreChange: -1,
      bonusScore: 0,
      nextStreak: 0,
      nextScoreDelta: -1,
    };
  }

  return {
    scoreChange: 0,
    bonusScore: 0,
    nextStreak: 0,
    nextScoreDelta: 0,
  };
}

/** Bonus รวมจากสูตร score = wins - losses + bonus */
export function totalBonus(score = 0, wins = 0, losses = 0) {
  return Math.max(0, Number(score) - Number(wins) + Number(losses));
}
