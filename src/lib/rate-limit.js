/** Rate limit แบบ in-memory (single instance) */
const buckets = new Map();

export const GAME_RATE_LIMITS = {
  "game:start": { max: 8, windowMs: 60_000 },
  "game:move": { max: 45, windowMs: 60_000 },
};

const DEFAULT_MESSAGE =
  "คุณเล่นเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่";

/** ช่วง sweep key ที่หมดอายุ — กัน Map โตจาก idle users */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;

function bucketKey(userId, action) {
  return `${action}:${userId}`;
}

function sweepExpired(now) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getOrCreateEntry(key, windowMs, now) {
  const existing = buckets.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }
  const entry = { count: 0, resetAt: now + windowMs };
  buckets.set(key, entry);
  return entry;
}

/**
 * @param {string} userId
 * @param {keyof typeof GAME_RATE_LIMITS} action
 * @param {number} [now]
 */
export function checkRateLimit(userId, action, now = Date.now()) {
  const limit = GAME_RATE_LIMITS[action];
  if (!limit || !userId) {
    return { ok: true };
  }

  sweepExpired(now);

  const key = bucketKey(userId, action);
  const entry = getOrCreateEntry(key, limit.windowMs, now);

  if (entry.count >= limit.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 1000)
    );
    return {
      ok: false,
      retryAfterSeconds,
      message: DEFAULT_MESSAGE,
    };
  }

  entry.count += 1;
  return { ok: true };
}

/** จำนวน key ใน Map — ใช้ใน unit test */
export function rateLimitBucketSizeForTests() {
  return buckets.size;
}

/** ใช้ใน unit test — รีเซ็ต in-memory state */
export function resetRateLimitsForTests() {
  buckets.clear();
  lastSweepAt = 0;
}
