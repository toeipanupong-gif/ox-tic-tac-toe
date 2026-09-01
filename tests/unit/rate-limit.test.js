import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  GAME_RATE_LIMITS,
  rateLimitBucketSizeForTests,
  resetRateLimitsForTests,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests under the limit", () => {
    const { max } = GAME_RATE_LIMITS["game:start"];
    for (let i = 0; i < max; i += 1) {
      expect(checkRateLimit("user-1", "game:start", 1_000).ok).toBe(true);
    }
  });

  it("blocks when limit exceeded", () => {
    const { max } = GAME_RATE_LIMITS["game:move"];
    const now = 5_000;

    for (let i = 0; i < max; i += 1) {
      checkRateLimit("user-2", "game:move", now);
    }

    const blocked = checkRateLimit("user-2", "game:move", now + 1);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.message).toContain("เร็วเกินไป");
  });

  it("resets after window expires", () => {
    const { max, windowMs } = GAME_RATE_LIMITS["game:start"];
    const start = 10_000;

    for (let i = 0; i < max; i += 1) {
      checkRateLimit("user-3", "game:start", start);
    }
    expect(checkRateLimit("user-3", "game:start", start).ok).toBe(false);

    expect(checkRateLimit("user-3", "game:start", start + windowMs + 1).ok).toBe(
      true
    );
  });

  it("tracks users independently", () => {
    const { max } = GAME_RATE_LIMITS["game:start"];
    const now = 20_000;

    for (let i = 0; i < max; i += 1) {
      checkRateLimit("user-a", "game:start", now);
    }

    expect(checkRateLimit("user-a", "game:start", now).ok).toBe(false);
    expect(checkRateLimit("user-b", "game:start", now).ok).toBe(true);
  });

  it("sweeps expired idle keys", () => {
    const { windowMs } = GAME_RATE_LIMITS["game:start"];
    const start = 30_000;

    checkRateLimit("idle-user", "game:start", start);
    expect(rateLimitBucketSizeForTests()).toBe(1);

    // ข้าม sweep interval + window ของ key เดิม
    checkRateLimit("other", "game:start", start + 60_000 + windowMs + 1);
    expect(rateLimitBucketSizeForTests()).toBe(1);
  });
});
