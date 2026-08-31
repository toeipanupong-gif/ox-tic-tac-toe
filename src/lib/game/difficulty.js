export const DIFFICULTIES = ["EASY", "NORMAL", "HARD"];

export const DIFFICULTY_LABELS = {
  EASY: "Easy",
  NORMAL: "Normal",
  HARD: "Hard",
};

export const DEFAULT_DIFFICULTY = "NORMAL";

/** Shared across /dashboard, /leaderboard, /profile, /admin */
export const DIFFICULTY_STORAGE_KEY = "ox-difficulty";
const LEGACY_DIFFICULTY_STORAGE_KEY = "ox-dashboard-difficulty";

export function normalizeDifficulty(value) {
  const key = String(value || "").toUpperCase();
  return DIFFICULTIES.includes(key) ? key : DEFAULT_DIFFICULTY;
}

export function difficultyLabel(value) {
  return DIFFICULTY_LABELS[normalizeDifficulty(value)];
}

export function readStoredDifficulty() {
  if (typeof window === "undefined") return DEFAULT_DIFFICULTY;
  const stored =
    localStorage.getItem(DIFFICULTY_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_DIFFICULTY_STORAGE_KEY);
  const next = normalizeDifficulty(stored);
  if (stored && !localStorage.getItem(DIFFICULTY_STORAGE_KEY)) {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, next);
  }
  return next;
}

export function writeStoredDifficulty(value) {
  const next = normalizeDifficulty(value);
  localStorage.setItem(DIFFICULTY_STORAGE_KEY, next);
  return next;
}
