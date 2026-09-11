import crypto from "crypto";
import type { Response, Request } from "express";
import { eq, and, gt } from "drizzle-orm";
import { sessions } from "../db/schema.js";
import type { AppDatabase } from "../db/index.js";
import { config } from "../config.js";

export interface SessionData {
  sessionId: string;
  userType: "admin" | "member_account";
  userId: number;
  expiresAt: Date;
}

/**
 * Creates a cryptographically random session record in the database.
 */
export async function createSession(
  db: AppDatabase,
  userType: "admin" | "member_account",
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionData> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.sessionMaxAgeMs);

  await (db as any).insert(sessions).values({
    id: sessionId,
    userType,
    userId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    expiresAt,
    createdAt: new Date(),
  });

  return {
    sessionId,
    userType,
    userId,
    expiresAt,
  };
}

/**
 * Validates and retrieves an active session by token.
 * Expired sessions are cleanly purged and rejected.
 */
export async function getSession(db: AppDatabase, sessionId: string): Promise<SessionData | null> {
  if (!sessionId || typeof sessionId !== "string") {
    return null;
  }

  const results = await (db as any)
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!results || results.length === 0) {
    return null;
  }

  const rec = results[0];
  return {
    sessionId: rec.id,
    userType: rec.userType as "admin" | "member_account",
    userId: rec.userId,
    expiresAt: rec.expiresAt,
  };
}

/**
 * Revokes and deletes a session upon logout.
 */
export async function deleteSession(db: AppDatabase, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await (db as any).delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Configures the secure session cookie on the Express HTTP response.
 */
export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(config.sessionCookieName, sessionId, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge: config.sessionMaxAgeMs,
    path: "/",
  });
}

/**
 * Clears the session cookie from the client.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Extracts session ID from incoming request cookies or Authorization header.
 */
export function extractSessionId(req: Request): string | null {
  if (req.cookies && req.cookies[config.sessionCookieName]) {
    return req.cookies[config.sessionCookieName];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}
