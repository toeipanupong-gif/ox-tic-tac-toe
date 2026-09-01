import { describe, expect, it, beforeAll } from "vitest";
import {
  computeEmailLookup,
  decryptPii,
  encryptPii,
  isPiiEncrypted,
  maskEmail,
  maskName,
  revealUserPii,
  toStoredUserPii,
} from "../../src/lib/pii.js";

beforeAll(() => {
  if (!process.env.PII_ENCRYPTION_KEY) {
    process.env.PII_ENCRYPTION_KEY =
      "kF0jmYmSYgTknwg37D/TFbk+5VrpAzAmn4sgRIGSywE=";
  }
});

describe("pii", () => {
  it("encrypts and decrypts plaintext", () => {
    const cipher = encryptPii("Alice");
    expect(isPiiEncrypted(cipher)).toBe(true);
    expect(cipher).not.toContain("Alice");
    expect(decryptPii(cipher)).toBe("Alice");
  });

  it("leaves legacy plaintext readable via decryptPii", () => {
    expect(decryptPii("Bob")).toBe("Bob");
  });

  it("emailLookup is stable and not reversible to email", () => {
    const a = computeEmailLookup("User@Example.com");
    const b = computeEmailLookup("user@example.com");
    expect(a).toBe(b);
    expect(a).not.toContain("example");
  });

  it("toStoredUserPii encrypts name/email and sets lookup", () => {
    const stored = toStoredUserPii({
      name: "Panupong",
      email: "panupong@example.com",
    });
    expect(isPiiEncrypted(stored.name)).toBe(true);
    expect(isPiiEncrypted(stored.email)).toBe(true);
    expect(stored.emailLookup).toBe(
      computeEmailLookup("panupong@example.com")
    );
  });

  it("revealUserPii converts PII back for display", () => {
    const stored = toStoredUserPii({
      id: "u1",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
    });
    const shown = revealUserPii(stored);
    expect(shown.name).toBe("Test User");
    expect(shown.email).toBe("test@example.com");
    expect(shown.role).toBe("USER");
  });

  it("maskName hides middle characters", () => {
    expect(maskName("Panupong")).toBe("P******g");
    expect(maskName("Ab")).toBe("A*");
    expect(maskName("")).toBe("-");
  });

  it("maskEmail hides local and domain middle", () => {
    expect(maskEmail("panupong@example.com")).toBe("p***@e***.com");
    expect(maskEmail("a@b.co")).toBe("*@b***.co");
    expect(maskEmail("")).toBe("-");
  });
});
