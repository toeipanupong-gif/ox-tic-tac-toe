import crypto from "crypto";

const VERSION_PREFIX = "pii1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const LOOKUP_INFO = "user-pii-lookup-v1";

const USER_PII_FIELDS = ["name", "email"];

function parseEncryptionKey(envValue) {
  if (envValue === undefined || envValue === null || String(envValue).trim() === "") {
    throw new Error("PII_ENCRYPTION_KEY is not set.");
  }
  const buf = Buffer.from(String(envValue).trim(), "base64");
  if (buf.length < 32) {
    throw new Error(
      "PII_ENCRYPTION_KEY must decode to at least 32 bytes (openssl rand -base64 32)."
    );
  }
  return buf.subarray(0, 32);
}

function getMasterKey() {
  return parseEncryptionKey(process.env.PII_ENCRYPTION_KEY);
}

function getLookupKey() {
  return crypto.createHmac("sha256", getMasterKey()).update(LOOKUP_INFO).digest();
}

export function isPiiEncrypted(value) {
  return typeof value === "string" && value.startsWith(VERSION_PREFIX);
}

export function encryptPii(plaintext) {
  if (plaintext == null) return null;
  const plain = String(plaintext);
  if (!plain) return plain;
  if (isPiiEncrypted(plain)) return plain;

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return VERSION_PREFIX + payload.toString("base64url");
}

export function decryptPii(value) {
  if (value == null) return value;
  if (!isPiiEncrypted(value)) return value;

  try {
    const masterKey = getMasterKey();
    const payload = Buffer.from(value.slice(VERSION_PREFIX.length), "base64url");
    if (payload.length < IV_LENGTH + TAG_LENGTH + 1) return "";

    const iv = payload.subarray(0, IV_LENGTH);
    const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const enc = payload.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function computeEmailLookup(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return crypto
    .createHmac("sha256", getLookupKey())
    .update(`email:${normalized}`)
    .digest("hex");
}

/** เข้ารหัส name/email สำหรับเก็บใน DB + ตั้ง emailLookup */
export function toStoredUserPii(data = {}) {
  const out = { ...data };

  if (Object.prototype.hasOwnProperty.call(out, "name")) {
    if (out.name == null || out.name === "") {
      out.name = out.name ?? null;
    } else if (!isPiiEncrypted(out.name)) {
      out.name = encryptPii(String(out.name).trim());
    }
  }

  if (Object.prototype.hasOwnProperty.call(out, "email")) {
    if (out.email == null || out.email === "") {
      out.email = out.email ?? null;
      out.emailLookup = null;
    } else if (!isPiiEncrypted(out.email)) {
      const plain = normalizeEmail(out.email);
      out.emailLookup = computeEmailLookup(plain);
      out.email = encryptPii(plain);
    }
  }

  return out;
}

/** แปลง name/email จาก PII ใน DB เป็นค่าแสดงผล */
export function revealUserPii(user) {
  if (!user || typeof user !== "object") return user;

  const out = { ...user };
  for (const field of USER_PII_FIELDS) {
    if (typeof out[field] === "string") {
      out[field] = decryptPii(out[field]);
    }
  }
  return out;
}

export function revealUsersPii(users) {
  if (!Array.isArray(users)) return users;
  return users.map(revealUserPii);
}

/** Mask ชื่อสำหรับ export (ดูค่าจริงได้เฉพาะบนหน้าเว็บ) */
export function maskName(name) {
  if (name == null) return "-";
  const s = String(name).trim();
  if (!s) return "-";
  if (s.length === 1) return "*";
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}${"*".repeat(s.length - 2)}${s[s.length - 1]}`;
}

/** Mask อีเมลสำหรับ export */
export function maskEmail(email) {
  if (email == null) return "-";
  const s = String(email).trim();
  if (!s) return "-";
  const at = s.indexOf("@");
  if (at <= 0) return maskName(s);
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const maskedLocal =
    local.length <= 1 ? "*" : `${local[0]}***`;
  const dot = domain.lastIndexOf(".");
  const maskedDomain =
    domain.length === 0
      ? "***"
      : dot > 0
        ? `${domain[0]}***${domain.slice(dot)}`
        : `${domain[0]}***`;
  return `${maskedLocal}@${maskedDomain}`;
}

export { USER_PII_FIELDS };
