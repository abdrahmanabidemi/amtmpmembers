import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { administrators, memberAccounts, members } from "../db/schema.js";
import { verifyPassword } from "../auth/passwords.js";
import { createSession, deleteSession, setSessionCookie, clearSessionCookie, extractSessionId } from "../auth/session.js";
import { requireAdmin } from "../auth/middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

export const adminAuthRouter = Router();

/**
 * Administrator Login
 * Strictly checks the administrators table. Never admits member accounts.
 */
adminAuthRouter.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both your email address and password.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = await getDb();

    // If no administrator exists in the database yet, attempt initial seed
    const allAdmins = await (db as any)
      .select({ id: administrators.id })
      .from(administrators)
      .limit(1);

    if (!allAdmins || allAdmins.length === 0) {
      try {
        const { seedInitialData } = await import("../db/seed.js");
        await seedInitialData();
      } catch (seedErr: any) {
        console.warn("[Admin Login Seed Notice]:", seedErr?.message || seedErr);
      }
    }

    // Query administrator by email
    const adminRows = await (db as any)
      .select()
      .from(administrators)
      .where(eq(administrators.email, cleanEmail))
      .limit(1);

    if (!adminRows || adminRows.length === 0) {
      // Intentionally uniform error message to prevent user enumeration
      return res.status(401).json({
        success: false,
        error: "Invalid email address or password.",
      });
    }

    const admin = adminRows[0];

    if (admin.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        error: "Your administrator account has been deactivated. Please contact the lead administrator.",
      });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email address or password.",
      });
    }

    // Create secure session
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const session = await createSession(db, "admin", admin.id, ip, userAgent);

    setSessionCookie(res, session.sessionId);

    return res.json({
      success: true,
      message: "Administrator login successful.",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        accountStatus: admin.accountStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Administrator Logout
 */
adminAuthRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = extractSessionId(req);
    if (sessionId) {
      const db = await getDb();
      await deleteSession(db, sessionId);
    }
    clearSessionCookie(res);
    return res.json({
      success: true,
      message: "You have been logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Current Administrator Profile
 */
adminAuthRouter.get("/me", requireAdmin, async (req, res) => {
  return res.json({
    success: true,
    admin: req.user,
  });
});

/**
 * Administrator Dashboard Overview (Step 1 Foundation)
 */
adminAuthRouter.get("/dashboard-summary", requireAdmin, async (_req, res, next) => {
  try {
    const db = await getDb();

    // Query basic counts for dashboard shell
    const allAdmins = await (db as any).select().from(administrators);
    const allAccounts = await (db as any).select().from(memberAccounts);
    const allMembers = await (db as any).select().from(members);

    return res.json({
      success: true,
      stats: {
        administratorsCount: allAdmins.length,
        memberAccountsCount: allAccounts.length,
        registeredMembersCount: allMembers.length,
        pendingApplicationsCount: allAccounts.filter((a: any) => a.membershipStatus === "pending").length,
      },
    });
  } catch (err) {
    next(err);
  }
});
