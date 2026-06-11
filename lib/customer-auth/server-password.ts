import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 32;
const DIGEST = "sha256";

/**
 * Hash a password using PBKDF2 (Node-side).
 * Returns hash (hex) + salt (base64).
 */
export function hashPasswordServer(password: string): {
  hash: string;
  salt: string;
} {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return {
    hash: hash.toString("hex"),
    salt: salt.toString("base64"),
  };
}

/**
 * Verify a password against a stored hash + salt.
 * Constant-time comparison.
 */
export function verifyPasswordServer(
  password: string,
  expectedHashHex: string,
  saltB64: string
): boolean {
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(expectedHashHex, "hex");
    const actual = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
