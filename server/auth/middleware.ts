import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { administrators, memberAccounts } from "../db/schema.js";
import { extractSessionId, getSession, type SessionData } from "./session.js";

// Extended Express Request interface
declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
      user?: {
        id: number;
        email: string;
        userType: "admin" | "member_account";
        name?: string;
        phone?: string | null;
        membershipStatus?: string;
      };
    }
  }
}

/**
 * Base authentication middleware.
 * Verifies active session token in cookie or Bearer header, attaches user to req.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = extractSessionId(req);
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: "Your session has expired. Please log in again.",
      });
    }

    const db = await getDb();
    const session = await getSession(db, sessionId);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Your session has expired. Please log in again.",
      });
    }

    req.session = session;

    if (session.userType === "admin") {
      const adminRows = await (db as any)
        .select()
        .from(administrators)
        .where(eq(administrators.id, session.userId))
        .limit(1);

      if (!adminRows || adminRows.length === 0 || adminRows[0].accountStatus !== "active") {
        return res.status(401).json({
          success: false,
          error: "Administrator account is inactive or not found.",
        });
      }

      const admin = adminRows[0];
      req.user = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        userType: "admin",
      };
    } else if (session.userType === "member_account") {
      const memberAccountRows = await (db as any)
        .select()
        .from(memberAccounts)
        .where(eq(memberAccounts.id, session.userId))
        .limit(1);

      if (!memberAccountRows || memberAccountRows.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Member account not found.",
        });
      }

      const account = memberAccountRows[0];
      req.user = {
        id: account.id,
        email: account.email,
        phone: account.phone,
        membershipStatus: account.membershipStatus,
        userType: "member_account",
      };
    } else {
      return res.status(403).json({
        success: false,
        error: "Invalid account role.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces Administrator authorization.
 * Strictly rejects unauthenticated users and member accounts.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.userType !== "admin") {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access the administrator area.",
      });
    }
    next();
  });
}

/**
 * Enforces Member Account authorization.
 * Strictly rejects unauthenticated users and administrator accounts.
 */
export async function requireMember(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.userType !== "member_account") {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access the member portal.",
      });
    }
    next();
  });
}
