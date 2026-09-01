import { describe, expect, it, beforeAll } from "vitest";
import { encryptPii } from "../../src/lib/pii.js";
import {
  maskLeaderboardName,
  mapLeaderboardPlayer,
} from "../../src/lib/leaderboard.js";

beforeAll(() => {
  if (!process.env.PII_ENCRYPTION_KEY) {
    process.env.PII_ENCRYPTION_KEY =
      "kF0jmYmSYgTknwg37D/TFbk+5VrpAzAmn4sgRIGSywE=";
  }
});

describe("leaderboard", () => {
  it("maskLeaderboardName masks each word", () => {
    expect(maskLeaderboardName("John Doe")).toBe("J*** D**");
    expect(maskLeaderboardName("")).toBe("Player");
    expect(maskLeaderboardName("A")).toBe("*");
  });

  it("mapLeaderboardPlayer omits email and masks others", () => {
    const stat = {
      score: 10,
      wins: 3,
      losses: 1,
      draws: 0,
      user: {
        id: "u1",
        name: encryptPii("Alice Smith"),
        email: encryptPii("alice@example.com"),
      },
    };

    const masked = mapLeaderboardPlayer(stat);
    expect(masked).toEqual({
      id: "u1",
      name: "A*** S***",
      score: 10,
      wins: 3,
      losses: 1,
      draws: 0,
    });
    expect(masked).not.toHaveProperty("email");

    const self = mapLeaderboardPlayer(stat, { isSelf: true });
    expect(self.name).toBe("Alice Smith");
  });
});
