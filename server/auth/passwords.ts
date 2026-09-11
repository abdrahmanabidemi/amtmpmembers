import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Securely hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}
