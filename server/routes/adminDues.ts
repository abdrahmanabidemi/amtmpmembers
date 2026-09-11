import { Router } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { monthlyDues, members, memberAccounts } from "../db/schema.js";
import { requireAdmin } from "../auth/middleware.js";

export const adminDuesRouter = Router();

adminDuesRouter.use(requireAdmin);

/**
 * List Monthly Dues Records with filtering
 */
adminDuesRouter.get("/", async (req, res, next) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const status = (req.query.status as string) || "all";

    const db = await getDb();

    let query = (db as any)
      .select({
        id: monthlyDues.id,
        memberId: monthlyDues.memberId,
        fullName: members.fullName,
        registrationNumber: members.registrationNumber,
        email: memberAccounts.email,
        phone: memberAccounts.phone,
        month: monthlyDues.month,
        year: monthlyDues.year,
        amount: monthlyDues.amount,
        paymentStatus: monthlyDues.paymentStatus,
        paymentDate: monthlyDues.paymentDate,
        notes: monthlyDues.notes,
        recordedAt: monthlyDues.recordedAt,
      })
      .from(monthlyDues)
      .innerJoin(members, eq(monthlyDues.memberId, members.id))
      .innerJoin(memberAccounts, eq(members.memberAccountId, memberAccounts.id));

    const conditions = [];

    if (month && !isNaN(month)) conditions.push(eq(monthlyDues.month, month));
    if (year && !isNaN(year)) conditions.push(eq(monthlyDues.year, year));
    if (status !== "all") conditions.push(eq(monthlyDues.paymentStatus, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(monthlyDues.year), desc(monthlyDues.month));

    return res.json({
      success: true,
      count: rows.length,
      dues: rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Record or Update Monthly Dues Payment
 */
adminDuesRouter.post("/record", async (req, res, next) => {
  try {
    const { memberId, month, year, amount, paymentStatus, paymentDate, notes } = req.body;

    if (!memberId || isNaN(parseInt(memberId, 10))) {
      return res.status(400).json({ success: false, error: "Please specify a valid member ID." });
    }

    const cleanMemberId = parseInt(memberId, 10);
    const cleanMonth = parseInt(month, 10);
    const cleanYear = parseInt(year, 10);
    const cleanAmount = amount ? parseInt(amount, 10) : 5000;
    const cleanStatus = paymentStatus === "paid" ? "paid" : "unpaid";

    if (isNaN(cleanMonth) || cleanMonth < 1 || cleanMonth > 12) {
      return res.status(400).json({ success: false, error: "Month must be between 1 and 12." });
    }

    if (isNaN(cleanYear) || cleanYear < 2000 || cleanYear > 2100) {
      return res.status(400).json({ success: false, error: "Please provide a valid 4-digit year." });
    }

    const db = await getDb();

    // 1. Verify member is approved and active
    const memRows = await (db as any)
      .select()
      .from(members)
      .where(eq(members.id, cleanMemberId))
      .limit(1);

    if (!memRows || memRows.length === 0) {
      return res.status(404).json({ success: false, error: "Member not found. Only approved members can have dues recorded." });
    }

    const member = memRows[0];
    if (member.memberStatus !== "active") {
      return res.status(400).json({ success: false, error: "Cannot record dues for inactive or non-approved member." });
    }

    // 2. Insert or update dues record (prevent duplicate member/month/year)
    const existing = await (db as any)
      .select()
      .from(monthlyDues)
      .where(
        and(
          eq(monthlyDues.memberId, cleanMemberId),
          eq(monthlyDues.month, cleanMonth),
          eq(monthlyDues.year, cleanYear)
        )
      )
      .limit(1);

    let resultRecord: any;

    if (existing.length > 0) {
      // Update existing record
      const updated = await (db as any)
        .update(monthlyDues)
        .set({
          amount: cleanAmount,
          paymentStatus: cleanStatus,
          paymentDate: cleanStatus === "paid" ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
          notes: notes ? String(notes).trim() : null,
          recordedAt: new Date(),
        })
        .where(eq(monthlyDues.id, existing[0].id))
        .returning();

      resultRecord = updated[0];
    } else {
      // Insert new record
      const inserted = await (db as any)
        .insert(monthlyDues)
        .values({
          memberId: cleanMemberId,
          month: cleanMonth,
          year: cleanYear,
          amount: cleanAmount,
          paymentStatus: cleanStatus,
          paymentDate: cleanStatus === "paid" ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
          notes: notes ? String(notes).trim() : null,
          recordedAt: new Date(),
        })
        .returning();

      resultRecord = inserted[0];
    }

    return res.status(200).json({
      success: true,
      message: `Monthly dues recorded for ${member.fullName} (${cleanMonth}/${cleanYear}) as ${cleanStatus.toUpperCase()}.`,
      due: resultRecord,
      duesRecord: resultRecord,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Summary Metrics for Dues Overview
 */
adminDuesRouter.get("/summary", async (_req, res, next) => {
  try {
    const db = await getDb();
    const rows = await (db as any).select().from(monthlyDues);

    const totalRecords = rows.length;
    const paidRecords = rows.filter((r: any) => r.paymentStatus === "paid").length;
    const unpaidRecords = rows.filter((r: any) => r.paymentStatus === "unpaid").length;
    const waivedRecords = rows.filter((r: any) => r.paymentStatus === "waived").length;
    const totalCollected = rows
      .filter((r: any) => r.paymentStatus === "paid")
      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    return res.json({
      success: true,
      summary: {
        totalRecords,
        paidRecords,
        unpaidRecords,
        waivedRecords,
        paidCount: paidRecords,
        unpaidCount: unpaidRecords,
        waivedCount: waivedRecords,
        totalCollected,
        totalPaidAmount: totalCollected,
      },
    });
  } catch (err) {
    next(err);
  }
});
