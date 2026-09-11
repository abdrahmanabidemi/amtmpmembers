import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { memberAccounts, members } from "../db/schema.js";
import { requireAdmin } from "../auth/middleware.js";
import { generateNextRegistrationNumber } from "../services/registrationNumber.js";

export const adminApplicationsRouter = Router();

// Protect all application routes with Administrator authorization
adminApplicationsRouter.use(requireAdmin);

/**
 * List Applications with status filtering
 */
adminApplicationsRouter.get("/", async (req, res, next) => {
  try {
    const statusFilter = (req.query.status as string) || "pending";
    const db = await getDb();

    let query = (db as any).select().from(memberAccounts);

    if (statusFilter !== "all") {
      query = query.where(eq(memberAccounts.membershipStatus, statusFilter));
    }

    const rows = await query.orderBy(desc(memberAccounts.createdAt));

    const applications = rows.map((acc: any) => ({
      id: acc.id,
      fullName: acc.fullName,
      email: acc.email,
      phone: acc.phone,
      membershipStatus: acc.membershipStatus,
      rejectionReason: acc.rejectionReason,
      createdAt: acc.createdAt,
    }));

    return res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Approve Application
 * Validates pending status, activates member, generates unique AMTMP registration number.
 */
adminApplicationsRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ success: false, error: "Invalid application ID." });
    }

    const db = await getDb();

    // 1. Retrieve account
    const accounts = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.id, accountId))
      .limit(1);

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }

    const account = accounts[0];

    // 2. Validate current state is strictly 'pending'
    if (account.membershipStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot approve application with status '${account.membershipStatus}'. Only pending applications can be approved.`,
      });
    }

    // 3. Concurrency-safe atomic generation of official AMTMP registration number
    const regNumResult = await generateNextRegistrationNumber(db);
    const regNumber = regNumResult.registrationNumber;

    // 4. Update member account status to approved
    await (db as any)
      .update(memberAccounts)
      .set({
        membershipStatus: "approved",
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(memberAccounts.id, accountId));

    // 5. Create or activate member record in members table
    const newMemberRows = await (db as any)
      .insert(members)
      .values({
        memberAccountId: account.id,
        fullName: account.fullName,
        registrationNumber: regNumber,
        approvalDate: new Date(),
        memberStatus: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const member = newMemberRows[0];

    return res.json({
      success: true,
      message: `Application approved. Registration number ${regNumber} permanently assigned to ${member.fullName}.`,
      registrationNumber: regNumber,
      member: {
        id: member.id,
        fullName: member.fullName,
        registrationNumber: member.registrationNumber,
        approvalDate: member.approvalDate,
        memberStatus: member.memberStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Reject Application
 * Sets status to rejected with optional administrator reason. No registration number generated.
 */
adminApplicationsRouter.post("/:id/reject", async (req, res, next) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ success: false, error: "Invalid application ID." });
    }

    const { reason } = req.body;
    const db = await getDb();

    // 1. Retrieve account
    const accounts = await (db as any)
      .select()
      .from(memberAccounts)
      .where(eq(memberAccounts.id, accountId))
      .limit(1);

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }

    const account = accounts[0];

    // 2. Validate current state is strictly 'pending'
    if (account.membershipStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot reject application with status '${account.membershipStatus}'. Only pending applications can be rejected.`,
      });
    }

    // 3. Mark rejected with reason
    const cleanReason = reason && typeof reason === "string" ? reason.trim() : null;

    await (db as any)
      .update(memberAccounts)
      .set({
        membershipStatus: "rejected",
        rejectionReason: cleanReason,
        updatedAt: new Date(),
      })
      .where(eq(memberAccounts.id, accountId));

    return res.json({
      success: true,
      message: "Application rejected.",
      rejectionReason: cleanReason,
    });
  } catch (err) {
    next(err);
  }
});
